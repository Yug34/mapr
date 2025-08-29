import { Handle, Position } from "@xyflow/react";
import type { AudioNodeData } from "../../types/common";

export function AudioNode(NodeData: { data: AudioNodeData }) {
  const { data } = NodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <audio src={data.audioBlobUrl} controls />
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
