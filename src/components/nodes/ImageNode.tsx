import type { NodeProps } from "@xyflow/react";
import type { ImageNodeData } from "../../types/common";
import { HandlesArray } from "../../utils/components";

export function ImageNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as ImageNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <img src={nodeData.imageBlobUrl} alt="Image" />
      <HandlesArray nodeId={id} />
    </div>
  );
}
