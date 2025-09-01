import type { Edge } from "@xyflow/react";
import { create } from "zustand";
import type { CustomNode } from "../types/common";

const initialNodes: CustomNode[] = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
  {
    id: "n3",
    type: "textUpdater",
    position: { x: 0, y: 200 },
    data: { label: "Node 3" },
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
}

export const useCanvasStore = create<CanvasStore>()((set) => ({
  nodes: initialNodes,
  edges: initialEdges,
  setNodes: (nodes) =>
    set((state) => ({
      nodes: typeof nodes === "function" ? nodes(state.nodes) : nodes,
    })),
  setEdges: (edges) =>
    set((state) => ({
      edges: typeof edges === "function" ? edges(state.edges) : edges,
    })),
  addNode: (node: CustomNode) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),
  dragging: false,
  setDragging: (dragging) =>
    set((state) => ({
      dragging,
    })),
}));
