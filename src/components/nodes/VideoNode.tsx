import { Handle, Position } from "@xyflow/react";
import type { VideoNodeData } from "../../types/common";

export function VideoNode(NodeData: VideoNodeData) {
  const { data } = NodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <video src={data.videoBlobUrl} controls />
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
