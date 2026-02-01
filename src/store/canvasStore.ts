import type { Edge } from "@xyflow/react";
import { create } from "zustand";
import type { CustomNode } from "../types/common";
import {
  Stores,
  put,
  bulkPut,
  getAll,
  bulkDelete,
  getAllFromIndex,
  clearStore,
} from "../utils/sqliteDb";
import type { TabRecord } from "../utils/sqliteDb";
import type { TabIconKey, PDFNodeData, ImageNodeData } from "../types/common";
import {
  deserializeEdge,
  deserializeNode,
  serializeNode,
} from "../utils/serialization";
import { extractAndStoreNodeText } from "../services/extractionService";
import type { PersistedEdge, PersistedNode } from "../utils/serialization";
import { debounce, blobManager } from "../utils";
import { useExtractionStore } from "./extractionStore";
import type { MediaRecord } from "../utils/sqliteDb";
import skyscraperImage from "/skyscraper.png?url";
import comfortablyNumb from "/Comfortably Numb.mp4?url";
import haloOST from "/Halo OST.mp3?url";
import metamorphosis from "/Metamorphosis.pdf?url";
import whiteNights from "/WhiteNights.pdf?url";
import { initialNodes, initialEdges } from "../data";

interface CanvasStore {
  /** True when any NoteNode is being edited (title or content). Pane drag is disabled while true. */
  isNoteNodeEditing: boolean;
  setNoteNodeEditing: (editing: boolean) => void;
  nodes: CustomNode[];
  edges: Edge[];
  tabs: TabRecord[];
  activeTabId: string;
  setNodes: (
    nodes: CustomNode[] | ((prev: CustomNode[]) => CustomNode[]),
  ) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  addNode: (node: CustomNode) => void;
  deleteNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (edgeId: string) => void;
  initialized: boolean;
  initFromDb: () => Promise<void>;
  setActiveTab: (tabId: string) => void;
  addTab: (title: string) => Promise<string>;
  deleteTab: (tabId: string) => Promise<void>;
  updateTabTitle: (tabId: string, title: string) => Promise<void>;
  loadTabData: (tabId: string) => Promise<void>;
  /** Clear all DB tables and reinitialize with initial seed data (no page reload). */
  resetToInitialState: () => Promise<void>;
}

export const useCanvasStore = create<CanvasStore>()((set, get) => {
  const persistGraph = async () => {
    const state = get();
    const persistedNodes: PersistedNode[] = state.nodes.map((node) =>
      serializeNode(node, state.activeTabId),
    );
    const persistedEdges: PersistedEdge[] = state.edges.map((edge) => ({
      ...edge,
      tabId: state.activeTabId,
    }));

    // Only persist nodes and edges for the current tab
    const currentTabNodes = persistedNodes.filter(
      (node) => node.tabId === state.activeTabId,
    );
    const currentTabEdges = persistedEdges.filter(
      (edge) => edge.tabId === state.activeTabId,
    );

    // Delete existing nodes/edges for this tab and add new ones
    const existingNodes = await getAllFromIndex<PersistedNode>(
      Stores.nodes,
      "tabId",
      state.activeTabId,
    );
    const existingEdges = await getAllFromIndex<PersistedEdge>(
      Stores.edges,
      "tabId",
      state.activeTabId,
    );

    await Promise.all([
      bulkDelete(
        Stores.nodes,
        existingNodes.map((n) => n.id),
      ),
      bulkDelete(
        Stores.edges,
        existingEdges.map((e) => e.id),
      ),
    ]);

    await Promise.all([
      bulkPut(Stores.nodes, currentTabNodes),
      bulkPut(Stores.edges, currentTabEdges),
    ]);
  };

  const persistGraphDebounced = debounce(persistGraph, 500);

  const seedInitialMedia = async () => {
    // Check if initial media already exists
    const existingMedia = await getAll<MediaRecord>(Stores.media);
    const existingMediaIds = new Set(existingMedia.map((m) => m.id));

    const initialMediaConfig = [
      {
        url: skyscraperImage,
        mediaId: "skyscraper-image",
        fileName: "skyscraper.png",
        mime: "image/png",
      },
      {
        url: haloOST,
        mediaId: "halo-ost",
        fileName: "Halo OST.mp3",
        mime: "audio/mpeg",
      },
      {
        url: comfortablyNumb,
        mediaId: "comfortably-numb",
        fileName: "Comfortably Numb.mp4",
        mime: "video/mp4",
      },
      {
        url: metamorphosis,
        mediaId: "metamorphosis",
        fileName: "Metamorphosis.pdf",
        mime: "application/pdf",
      },
      {
        url: whiteNights,
        mediaId: "white-nights",
        fileName: "WhiteNights.pdf",
        mime: "application/pdf",
      },
    ];

    // Filter out media that already exists
    const mediaToSeed = initialMediaConfig.filter(
      (config) => !existingMediaIds.has(config.mediaId),
    );

    if (mediaToSeed.length === 0) return;

    // Fetch and create MediaRecords for each initial media file
    const mediaRecords = await Promise.all(
      mediaToSeed.map(async (config) => {
        const response = await fetch(config.url);
        const blob = await response.blob();

        return {
          id: config.mediaId,
          blob,
          mime: config.mime,
          size: blob.size,
          createdAt: Date.now(),
        } as MediaRecord;
      }),
    );

    await bulkPut(Stores.media, mediaRecords);
  };

  /** Run text extraction for PDF/Image nodes that don't have a node_text row yet (e.g. seeded or loaded from DB). */
  const triggerExtractionForNodesWithoutText = async (
    nodes: CustomNode[],
  ): Promise<void> => {
    const existing = await getAll<{ nodeId: string }>(Stores.node_text);
    const existingIds = new Set(existing.map((r) => r.nodeId));
    for (const node of nodes) {
      if (node.type !== "PDFNode" && node.type !== "ImageNode") continue;
      if (existingIds.has(node.id)) continue;
      const data = node.data as PDFNodeData | ImageNodeData;
      let source: Blob | string | undefined = data.mediaId
        ? blobManager.getMediaBlob(data.mediaId)
        : undefined;
      if (!source && node.type === "PDFNode")
        source = (data as PDFNodeData).pdfBlobUrl;
      if (!source && node.type === "ImageNode")
        source = (data as ImageNodeData).imageBlobUrl;
      if (!source) continue;
      void extractAndStoreNodeText(node.id, node.type, source);
    }
  };

  const loadFromDb = async () => {
    if (get().initialized) return;
    try {
      const [tabs, persistedNodes, persistedEdges] = await Promise.all([
        getAll<TabRecord>(Stores.tabs),
        getAll<PersistedNode>(Stores.nodes),
        getAll<PersistedEdge>(Stores.edges),
      ]);

      let activeTabId = "default-tab";

      if (tabs.length === 0) {
        // Create default tab if none exist
        const defaultTab: TabRecord = {
          id: "default-tab",
          title: "Home",
          iconKey: "home",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await bulkPut(Stores.tabs, [defaultTab]);
        tabs.push(defaultTab);
      } else {
        activeTabId = tabs[tabs.length - 1].id;
      }

      if (persistedNodes.length === 0 && persistedEdges.length === 0) {
        // seed current defaults into DB for the default tab
        const persistedNodes: PersistedNode[] = initialNodes.map((node) =>
          serializeNode(node, activeTabId),
        );
        const persistedEdges: PersistedEdge[] = initialEdges.map((edge) => ({
          ...edge,
          tabId: activeTabId,
        }));

        // Seed initial media files into DB
        await seedInitialMedia();

        await Promise.all([
          bulkPut(Stores.nodes, persistedNodes),
          bulkPut(Stores.edges, persistedEdges),
        ]);

        // Populate in-memory Blobs so PDFNode (and other media nodes) can use Blob directly
        const seedMediaRecords = await getAll<MediaRecord>(Stores.media);
        blobManager.setMediaBlobsFromRecords(seedMediaRecords);

        // Seed image (n3) gets plainText "N/A" without running OCR
        await put(Stores.node_text, {
          nodeId: "n3",
          plainText: "N/A",
          updatedAt: Date.now(),
        });

        set(() => ({
          nodes: initialNodes,
          edges: initialEdges,
          tabs,
          activeTabId,
          initialized: true,
        }));
        void triggerExtractionForNodesWithoutText(initialNodes);
        return;
      }

      // Always ensure initial media is seeded (in case nodes/edges exist but media doesn't)
      await seedInitialMedia();

      // Build mediaId -> blob URL and in-memory Blob map (Blobs for react-pdf, URLs for "open in new tab")
      const mediaRecords = await getAll<MediaRecord>(Stores.media);
      blobManager.setMediaBlobsFromRecords(mediaRecords);
      const mediaUrlById = new Map<string, string>(
        mediaRecords.map((m) => [m.id, blobManager.createBlobUrl(m.blob)]),
      );

      const resolveBlobUrl = (mediaId: string) => mediaUrlById.get(mediaId);

      // Load data for the active tab
      const activeTabNodes = persistedNodes.filter(
        (n) => n.tabId === activeTabId,
      );
      const activeTabEdges = persistedEdges.filter(
        (e) => e.tabId === activeTabId,
      );

      const nodes = activeTabNodes.map((n) =>
        deserializeNode(n, resolveBlobUrl),
      );
      const edges = activeTabEdges.map((e) => deserializeEdge(e));

      set(() => ({
        nodes,
        edges,
        tabs,
        activeTabId,
        initialized: true,
      }));
      void triggerExtractionForNodesWithoutText(nodes);
    } catch (err) {
      // fallback to defaults on any failure
      console.error("Failed to load from SQLite + WASM", err);
      set(() => ({
        nodes: initialNodes,
        edges: initialEdges,
        tabs: [
          {
            id: "default-tab",
            title: "Home",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        activeTabId: "default-tab",
        initialized: true,
      }));
      void triggerExtractionForNodesWithoutText(initialNodes);
    }
  };

  const loadTabData = async (tabId: string) => {
    try {
      const [persistedNodes, persistedEdges] = await Promise.all([
        getAllFromIndex<PersistedNode>(Stores.nodes, "tabId", tabId),
        getAllFromIndex<PersistedEdge>(Stores.edges, "tabId", tabId),
      ]);

      // Build mediaId -> blob URL and in-memory Blobs (same as loadFromDb)
      const mediaRecords = await getAll<MediaRecord>(Stores.media);
      blobManager.setMediaBlobsFromRecords(mediaRecords);
      const mediaUrlById = new Map<string, string>(
        mediaRecords.map((m) => [m.id, blobManager.createBlobUrl(m.blob)]),
      );

      const resolveBlobUrl = (mediaId: string) => mediaUrlById.get(mediaId);

      const nodes = persistedNodes.map((n) =>
        deserializeNode(n, resolveBlobUrl),
      );
      const edges = persistedEdges.map((e) => deserializeEdge(e));

      set(() => ({ nodes, edges }));
      void triggerExtractionForNodesWithoutText(nodes);
    } catch (err) {
      console.error("Failed to load tab data", err);
      set(() => ({ nodes: [], edges: [] }));
    }
  };

  const addTab = async (title: string): Promise<string> => {
    const iconCycle: TabIconKey[] = [
      "home",
      "star",
      "bolt",
      "folder",
      "atom",
      "globe",
      "bookOpen",
      "focus",
      "flower",
      "medal",
    ];

    const nextIcon = iconCycle[get().tabs.length % iconCycle.length];
    const newTab: TabRecord = {
      id: crypto.randomUUID(),
      title,
      iconKey: nextIcon,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await bulkPut(Stores.tabs, [newTab]);

    const defaultNoteNode: CustomNode = {
      id: crypto.randomUUID(),
      type: "NoteNode",
      position: { x: 160, y: 120 },
      data: {
        title: "New note",
        content: "- Click to edit...",
      },
    };

    await bulkPut(Stores.nodes, [serializeNode(defaultNoteNode, newTab.id)]);

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));

    await loadTabData(newTab.id);

    return newTab.id;
  };

  const deleteTab = async (tabId: string): Promise<void> => {
    const state = get();

    // Don't allow deleting the last tab
    if (state.tabs.length <= 1) {
      throw new Error("Cannot delete the last tab");
    }

    // Delete all nodes and edges for this tab
    const [tabNodes, tabEdges] = await Promise.all([
      getAllFromIndex<PersistedNode>(Stores.nodes, "tabId", tabId),
      getAllFromIndex<PersistedEdge>(Stores.edges, "tabId", tabId),
    ]);

    await Promise.all([
      bulkDelete(
        Stores.nodes,
        tabNodes.map((n) => n.id),
      ),
      bulkDelete(
        Stores.edges,
        tabEdges.map((e) => e.id),
      ),
      bulkDelete(Stores.tabs, [tabId]),
    ]);

    // If we're deleting the active tab, switch to another tab
    let newActiveTabId = state.activeTabId;
    if (state.activeTabId === tabId) {
      const remainingTabs = state.tabs.filter((t) => t.id !== tabId);
      newActiveTabId = remainingTabs[0].id;
      await loadTabData(newActiveTabId);
    }

    set((state) => ({
      tabs: state.tabs.filter((t) => t.id !== tabId),
      activeTabId: newActiveTabId,
    }));
  };

  const updateTabTitle = async (
    tabId: string,
    title: string,
  ): Promise<void> => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    const updatedTab = { ...tab, title, updatedAt: Date.now() };
    await bulkPut(Stores.tabs, [updatedTab]);

    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? updatedTab : t)),
    }));
  };

  const resetToInitialState = async (): Promise<void> => {
    await Promise.all([
      clearStore(Stores.nodes),
      clearStore(Stores.edges),
      clearStore(Stores.media),
      clearStore(Stores.meta),
      clearStore(Stores.tabs),
      clearStore(Stores.node_text),
    ]);
    blobManager.revokeAllBlobUrls();
    useExtractionStore.getState().clearAll();
    set({ initialized: false });
    await get().initFromDb();
  };

  return {
    isNoteNodeEditing: false,
    setNoteNodeEditing: (editing: boolean) =>
      set({ isNoteNodeEditing: editing }),
    nodes: initialNodes,
    edges: initialEdges,
    tabs: [],
    activeTabId: "default-tab",
    setNodes: (nodes) =>
      set((state) => {
        const nextNodes =
          typeof nodes === "function" ? nodes(state.nodes) : nodes;
        persistGraphDebounced();
        return { nodes: nextNodes };
      }),
    addNode: (node: CustomNode) => {
      set((state) => {
        const nextNodes = [...state.nodes, node];
        persistGraphDebounced();
        return { nodes: nextNodes };
      });
    },
    deleteNode: (nodeId: string) =>
      set((state) => {
        // Clean up blob URLs for the deleted node
        blobManager.revokeNodeBlobUrls(nodeId);

        const nextNodes = state.nodes.filter((node) => node.id !== nodeId);
        persistGraphDebounced();
        return { nodes: nextNodes };
      }),
    setEdges: (edges) =>
      set((state) => {
        const nextEdges =
          typeof edges === "function" ? edges(state.edges) : edges;
        persistGraphDebounced();
        return { edges: nextEdges };
      }),
    deleteEdge: (edgeId: string) =>
      set((state) => {
        const nextEdges = state.edges.filter((edge) => edge.id !== edgeId);
        persistGraphDebounced();
        return { edges: nextEdges };
      }),
    addEdge: (edge: Edge) =>
      set((state) => {
        const nextEdges = [...state.edges, edge];
        persistGraphDebounced();
        return { edges: nextEdges };
      }),

    initialized: false,
    initFromDb: loadFromDb,

    setActiveTab: (tabId: string) => {
      set(() => ({ activeTabId: tabId }));
      loadTabData(tabId);
    },
    addTab,
    deleteTab,
    updateTabTitle,
    loadTabData,
    resetToInitialState,
  };
});
