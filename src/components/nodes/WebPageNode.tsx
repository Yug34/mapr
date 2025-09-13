import { Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { WebPageNodeData } from "../../types/common";
import { CustomHandle } from "../../utils/components";

// https://web.mit.edu/6.001/6.037/sicp.pdf

export function WebPageNode(props: NodeProps) {
  const { data } = props;
  const nodeData = data as WebPageNodeData;
  return (
    <div>
      <div>Page to {nodeData.url}</div>
      <CustomHandle type="source" position={Position.Top} id="top" />
      <CustomHandle type="target" position={Position.Top} id="top-target" />
      <CustomHandle type="source" position={Position.Bottom} id="bottom" />
      <CustomHandle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
      />
      <CustomHandle type="source" position={Position.Left} id="left" />
      <CustomHandle type="target" position={Position.Left} id="left-target" />
      <CustomHandle type="source" position={Position.Right} id="right" />
      <CustomHandle type="target" position={Position.Right} id="right-target" />
    </div>
  );
}
