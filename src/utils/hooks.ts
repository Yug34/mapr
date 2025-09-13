import { useMemo } from "react";
import { useCanvasStore } from "../store/canvasStore";

/**
 * Custom hook to check if a handle has any connections
 * @param nodeId - The ID of the node containing the handle
 * @param handleId - The ID of the handle to check
 * @param handleType - The type of handle ('source' or 'target')
 * @returns boolean indicating if the handle has connections
 */
export const useHandleConnections = (
  nodeId: string,
  handleId: string,
  handleType: "source" | "target"
) => {
  const edges = useCanvasStore((state) => state.edges);

  return useMemo(() => {
    if (handleType === "source") {
      return edges.some(
        (edge) => edge.source === nodeId && edge.sourceHandle === handleId
      );
    } else {
      return edges.some(
        (edge) => edge.target === nodeId && edge.targetHandle === handleId
      );
    }
  }, [edges, nodeId, handleId, handleType]);
};
