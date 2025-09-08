import type { Edge } from "@xyflow/react";
import { create } from "zustand";
import type { CustomNode } from "../types/common";
import { Stores, bulkPut, clearStore, getAll } from "../utils/indexedDb";
import {
  deserializeEdge,
  deserializeNode,
  serializeNode,
} from "../utils/serialization";
import type { PersistedEdge, PersistedNode } from "../utils/serialization";
import type { MediaRecord } from "../utils/indexedDb";

const initialNodes: CustomNode[] = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
  {
    id: "n3",
    type: "textUpdater",
    position: { x: 0, y: 200 },
    data: { label: "Node 3" },
  },
  {
    id: "n4",
    type: "TODONode",
    position: { x: 0, y: 300 },
    data: {
      title: "Node 4",
      todos: [
        { id: "t1", title: "Todo 1", completed: false },
        { id: "t2", title: "Todo 2", completed: true },
      ],
    },
  },
];
const initialEdges = [
  { id: "n1-n2", source: "n1", target: "n2" },
  { id: "n1-n3", source: "n1", target: "n3" },
  { id: "n3-n2", source: "n3", target: "n2" },
];

interface CanvasStore {
  nodes: CustomNode[];
  edges: Edge[];
  setNodes: (
    nodes: CustomNode[] | ((prev: CustomNode[]) => CustomNode[])
  ) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  addNode: (node: CustomNode) => void;
  dragging: boolean;
  setDragging: (dragging: boolean) => void;
  initialized: boolean;
  initFromDb: () => Promise<void>;
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
    const persistedNodes: PersistedNode[] = state.nodes.map(serializeNode);
    const persistedEdges: PersistedEdge[] = state.edges as PersistedEdge[];
    await Promise.all([
      clearStore(Stores.nodes).then(() =>
        bulkPut(Stores.nodes, persistedNodes)
      ),
      clearStore(Stores.edges).then(() =>
        bulkPut(Stores.edges, persistedEdges)
      ),
    ]);
  };

  const persistGraphDebounced = debounce(persistGraph, 500);

  const loadFromDb = async () => {
    if (get().initialized) return;
    try {
      const [persistedNodes, persistedEdges] = await Promise.all([
        getAll<PersistedNode>(Stores.nodes),
        getAll<PersistedEdge>(Stores.edges),
      ]);

      if (persistedNodes.length === 0 && persistedEdges.length === 0) {
        // seed current defaults into DB
        await persistGraph();
        set(() => ({ initialized: true }));
        return;
      }

      // Build mediaId -> blobURL map for rehydration
      const mediaRecords = await getAll<MediaRecord>(Stores.media);
      const mediaUrlById = new Map<string, string>(
        mediaRecords.map((m) => [m.id, URL.createObjectURL(m.blob)])
      );
      const resolveBlobUrl = (mediaId: string) => mediaUrlById.get(mediaId);

      const nodes = persistedNodes.map((n) =>
        deserializeNode(n, resolveBlobUrl)
      );
      const edges = persistedEdges.map((e) => deserializeEdge(e));

      set(() => ({ nodes, edges, initialized: true }));
    } catch (err) {
      // fallback to defaults on any failure
      console.error("Failed to load from IndexedDB", err);
      set(() => ({ initialized: true }));
    }
  };

  return {
    nodes: initialNodes,
    edges: initialEdges,
    setNodes: (nodes) =>
      set((state) => {
        const nextNodes =
          typeof nodes === "function" ? nodes(state.nodes) : nodes;
        // schedule persistence
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

    dragging: false,
    setDragging: (dragging) => set(() => ({ dragging })),
    initialized: false,
    initFromDb: loadFromDb,
  };
});
