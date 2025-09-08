import { Handle, Position } from "@xyflow/react";
import type { ImageNodeData } from "../../types/common";

export function ImageNode(NodeData: ImageNodeData) {
  const { data } = NodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <img src={data.imageBlobUrl} alt="Image" />
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
