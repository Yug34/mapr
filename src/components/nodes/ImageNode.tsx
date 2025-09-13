import { Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { ImageNodeData } from "../../types/common";
import { CustomHandle } from "../../utils/components";

export function ImageNode(props: NodeProps) {
  const { data } = props;
  const nodeData = data as ImageNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <img src={nodeData.imageBlobUrl} alt="Image" />
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
