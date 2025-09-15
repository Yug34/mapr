import type { Edge } from "@xyflow/react";
import { create } from "zustand";
import type { CustomNode, TODONodeData, ImageNodeData } from "../types/common";
import {
  Stores,
  bulkPut,
  getAll,
  bulkDelete,
  getAllFromIndex,
} from "../utils/indexedDb";
import type { TabRecord } from "../utils/indexedDb";
import {
  deserializeEdge,
  deserializeNode,
  serializeNode,
} from "../utils/serialization";
import type { PersistedEdge, PersistedNode } from "../utils/serialization";
import type { MediaRecord } from "../utils/indexedDb";
import { blobManager } from "../utils/blobManager";
// Import the image - this will be processed by Vite
import skyscraperImage from "/public/skyscraper.png";

const initialNodes: CustomNode[] = [
  {
    id: "n1",
    position: { x: 0, y: 0 },
    type: "NoteNode",
    data: {
      title: "About mapr",
      content: `I used to use a mind map app called [**Edvo**](https://www.linkedin.com/company/edvo).\n\n
Unfortunately, they shut down :(\n\n
So I made this for myself :D\n\n
**Source code on GitHub**: [mapr](https://github.com/yug34/mapr).`,
    },
  },
  {
    id: "n2",
    position: { x: 250, y: 250 },
    type: "NoteNode",
    data: {
      title: "'lil Tutorial",
      content: `- Copy and paste PDFs, links, images, audio, videos, and text to create nodes.
- Click and drag to move the nodes.
- Right click on the canvas to add new nodes.
- Right click on a node/edge to duplicate/delete.
- Connect edges from a handle to another handle.`,
    },
  },
  {
    id: "n3",
    type: "ImageNode",
    position: { x: 500, y: 0 },
    data: {
      fileName: "skyscraper.png",
      imageBlobUrl: skyscraperImage,
      image: undefined as unknown as File,
      imageBase64: "",
      mediaId: "skyscraper-image",
    } as ImageNodeData,
  },
  {
    id: "n4",
    type: "TODONode",
    position: { x: -250, y: 250 },
    data: {
      title: "Today's TODOs",
      todos: [
        { id: "t1", title: "Hydrate yourself", completed: false },
        { id: "t2", title: "Look pretty", completed: true },
        {
          id: "t3",
          title: "Crack a smile, it's a good day! 🌻",
          completed: false,
        },
      ],
    } as TODONodeData,
  },
];

const initialEdges = [
  {
    id: "n1-n2",
    target: "n2",
    source: "n1",
    sourceHandle: "bottom",
    targetHandle: "top-target",
  },
  {
    id: "n1-n4",
    target: "n4",
    source: "n1",
    sourceHandle: "bottom",
    targetHandle: "top-target",
  },
];

interface CanvasStore {
  nodes: CustomNode[];
  edges: Edge[];
  tabs: TabRecord[];
  activeTabId: string;
  setNodes: (
    nodes: CustomNode[] | ((prev: CustomNode[]) => CustomNode[])
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
}

const debounce = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
) => {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), delay);
  };
};

export const useCanvasStore = create<CanvasStore>()((set, get) => {
  const persistGraph = async () => {
    const state = get();
    const persistedNodes: PersistedNode[] = state.nodes.map((node) =>
      serializeNode(node, state.activeTabId)
    );
    const persistedEdges: PersistedEdge[] = state.edges.map((edge) => ({
      ...edge,
      tabId: state.activeTabId,
    }));

    // Only persist nodes and edges for the current tab
    const currentTabNodes = persistedNodes.filter(
      (node) => node.tabId === state.activeTabId
    );
    const currentTabEdges = persistedEdges.filter(
      (edge) => edge.tabId === state.activeTabId
    );

    // Delete existing nodes/edges for this tab and add new ones
    const existingNodes = await getAllFromIndex<PersistedNode>(
      Stores.nodes,
      "tabId",
      state.activeTabId
    );
    const existingEdges = await getAllFromIndex<PersistedEdge>(
      Stores.edges,
      "tabId",
      state.activeTabId
    );

    await Promise.all([
      bulkDelete(
        Stores.nodes,
        existingNodes.map((n) => n.id)
      ),
      bulkDelete(
        Stores.edges,
        existingEdges.map((e) => e.id)
      ),
    ]);

    await Promise.all([
      bulkPut(Stores.nodes, currentTabNodes),
      bulkPut(Stores.edges, currentTabEdges),
    ]);
  };

  const persistGraphDebounced = debounce(persistGraph, 500);

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
          serializeNode(node, activeTabId)
        );
        const persistedEdges: PersistedEdge[] = initialEdges.map((edge) => ({
          ...edge,
          tabId: activeTabId,
        }));

        await Promise.all([
          bulkPut(Stores.nodes, persistedNodes),
          bulkPut(Stores.edges, persistedEdges),
        ]);

        set(() => ({
          nodes: initialNodes,
          edges: initialEdges,
          tabs,
          activeTabId,
          initialized: true,
        }));
        return;
      }

      // Build mediaId -> blobURL map for rehydration
      const mediaRecords = await getAll<MediaRecord>(Stores.media);
      const mediaUrlById = new Map<string, string>(
        mediaRecords.map((m) => [m.id, blobManager.createBlobUrl(m.blob)])
      );

      // Add the imported skyscraper image
      mediaUrlById.set("skyscraper-image", skyscraperImage);

      const resolveBlobUrl = (mediaId: string) => mediaUrlById.get(mediaId);

      // Load data for the active tab
      const activeTabNodes = persistedNodes.filter(
        (n) => n.tabId === activeTabId
      );
      const activeTabEdges = persistedEdges.filter(
        (e) => e.tabId === activeTabId
      );

      const nodes = activeTabNodes.map((n) =>
        deserializeNode(n, resolveBlobUrl)
      );
      const edges = activeTabEdges.map((e) => deserializeEdge(e));

      set(() => ({
        nodes,
        edges,
        tabs,
        activeTabId,
        initialized: true,
      }));
    } catch (err) {
      // fallback to defaults on any failure
      console.error("Failed to load from IndexedDB", err);
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
    }
  };

  const loadTabData = async (tabId: string) => {
    try {
      const [persistedNodes, persistedEdges] = await Promise.all([
        getAllFromIndex<PersistedNode>(Stores.nodes, "tabId", tabId),
        getAllFromIndex<PersistedEdge>(Stores.edges, "tabId", tabId),
      ]);

      // Build mediaId -> blobURL map for rehydration
      const mediaRecords = await getAll<MediaRecord>(Stores.media);
      const mediaUrlById = new Map<string, string>(
        mediaRecords.map((m) => [m.id, blobManager.createBlobUrl(m.blob)])
      );

      // Add the imported skyscraper image
      mediaUrlById.set("skyscraper-image", skyscraperImage);

      const resolveBlobUrl = (mediaId: string) => mediaUrlById.get(mediaId);

      const nodes = persistedNodes.map((n) =>
        deserializeNode(n, resolveBlobUrl)
      );
      const edges = persistedEdges.map((e) => deserializeEdge(e));

      set(() => ({ nodes, edges }));
    } catch (err) {
      console.error("Failed to load tab data", err);
      set(() => ({ nodes: [], edges: [] }));
    }
  };

  const addTab = async (title: string): Promise<string> => {
    const newTab: TabRecord = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await bulkPut(Stores.tabs, [newTab]);

    set((state) => ({
      tabs: [...state.tabs, newTab],
    }));

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
        tabNodes.map((n) => n.id)
      ),
      bulkDelete(
        Stores.edges,
        tabEdges.map((e) => e.id)
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
    title: string
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

  return {
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
    addNode: (node: CustomNode) =>
      set((state) => {
        const nextNodes = [...state.nodes, node];
        persistGraphDebounced();
        return { nodes: nextNodes };
      }),
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
  };
});
