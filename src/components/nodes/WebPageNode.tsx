import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { WebPageNodeData } from "../../types/common";

// https://web.mit.edu/6.001/6.037/sicp.pdf

export function WebPageNode(props: NodeProps) {
  const { data } = props;
  const nodeData = data as WebPageNodeData;
  return (
    <div>
      <div>Page to {nodeData.url}</div>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
