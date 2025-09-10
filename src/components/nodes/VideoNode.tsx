import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { VideoNodeData } from "../../types/common";

export function VideoNode(props: NodeProps) {
  const { data } = props;
  const nodeData = data as VideoNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <video src={nodeData.videoBlobUrl} controls />
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
