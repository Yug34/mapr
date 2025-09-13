import type { Edge } from "@xyflow/react";
import { create } from "zustand";
import type { CustomNode, TODONodeData } from "../types/common";
import { Stores, bulkPut, clearStore, getAll } from "../utils/indexedDb";
import {
  deserializeEdge,
  deserializeNode,
  serializeNode,
} from "../utils/serialization";
import type { PersistedEdge, PersistedNode } from "../utils/serialization";
import type { MediaRecord } from "../utils/indexedDb";

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
