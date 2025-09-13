import type { NodeProps } from "@xyflow/react";
import type { WebPageNodeData } from "../../types/common";
import { HandlesArray } from "../../utils/components";

// https://web.mit.edu/6.001/6.037/sicp.pdf

export function WebPageNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as WebPageNodeData;
  return (
    <div>
      <div>Page to {nodeData.url}</div>
      <HandlesArray nodeId={id} />
    </div>
  );
}
