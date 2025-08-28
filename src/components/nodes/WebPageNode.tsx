import { Handle, Position } from "@xyflow/react";
import type { WebPageNodeData } from "../../types/common";

// https://web.mit.edu/6.001/6.037/sicp.pdf

export function WebPageNode(NodeData: { data: WebPageNodeData }) {
  const { data } = NodeData;
  return (
    <div>
      <div>Page to {data.url}</div>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
