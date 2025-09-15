import { useMemo } from "react";
import { useCanvasStore } from "../store/canvasStore";

// hook to check if a handle has any connections
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
