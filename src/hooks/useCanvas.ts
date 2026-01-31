import { useMemo } from "react";
import { useCanvasStore } from "../store/canvasStore";
import type { CustomNode } from "../types/common";

export const useHandleConnections = (
  nodeId: string,
  handleId: string,
  handleType: "source" | "target",
) => {
  const edges = useCanvasStore((state) => state.edges);

  return useMemo(() => {
    if (handleType === "source") {
      return edges.some(
        (edge) => edge.source === nodeId && edge.sourceHandle === handleId,
      );
    } else {
      return edges.some(
        (edge) => edge.target === nodeId && edge.targetHandle === handleId,
      );
    }
  }, [edges, nodeId, handleId, handleType]);
};

export const useCanvas = () => {
  const store = useCanvasStore();

  const updateNode = (nodeId: string, updates: Partial<CustomNode["data"]>) => {
    store.setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            }
          : node,
      ),
    );
  };

  const updateNodePosition = (
    nodeId: string,
    position: { x: number; y: number },
  ) => {
    store.setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              position,
            }
          : node,
      ),
    );
  };

  const updateNodeData = <T extends CustomNode["data"]>(
    nodeId: string,
    dataUpdates: Partial<T>,
  ) => {
    store.setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...dataUpdates,
              } as T,
            }
          : node,
      ),
    );
  };

  return {
    // Data
    nodes: store.nodes,
    edges: store.edges,
    isNoteNodeEditing: store.isNoteNodeEditing,
    setNoteNodeEditing: store.setNoteNodeEditing,
    tabs: store.tabs,
    activeTabId: store.activeTabId,
    initialized: store.initialized,

    // Node operations
    addNode: store.addNode,
    deleteNode: store.deleteNode,
    updateNode,
    updateNodePosition,
    updateNodeData,
    setNodes: store.setNodes,

    // Edge operations
    addEdge: store.addEdge,
    deleteEdge: store.deleteEdge,
    setEdges: store.setEdges,

    // Tab operations
    setActiveTab: store.setActiveTab,
    addTab: store.addTab,
    deleteTab: store.deleteTab,
    updateTabTitle: store.updateTabTitle,

    // Initialization
    initFromDb: store.initFromDb,
    resetToInitialState: store.resetToInitialState,
  };
};
