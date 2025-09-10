import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { ImageNodeData } from "../../types/common";

export function ImageNode(props: NodeProps) {
  const { data } = props;
  const nodeData = data as ImageNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <img src={nodeData.imageBlobUrl} alt="Image" />
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
