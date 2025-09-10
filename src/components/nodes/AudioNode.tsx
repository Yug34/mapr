import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { AudioNodeData } from "../../types/common";

export function AudioNode(props: NodeProps) {
  const { data } = props;
  const nodeData = data as AudioNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <audio src={nodeData.audioBlobUrl} controls />
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
