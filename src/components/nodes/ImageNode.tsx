import type { NodeProps } from "@xyflow/react";
import type { ImageNodeData } from "../../types/common";
import { HandlesArray } from "../../utils/components";
import { ImageViewer, ImageViewerContent } from "@/components/ui/image-viewer";

export function ImageNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as ImageNodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="mb-1 w-[360px] max-w-full text-xs text-center font-semibold truncate bg-white rounded border px-2 py-1"
        title={nodeData.fileName}
      >
        {nodeData.fileName}
      </div>
      <ImageViewer className="drag-handle w-[360px] max-w-full overflow-hidden rounded-lg border">
        <ImageViewerContent
          src={nodeData.imageBlobUrl}
          alt="Image"
          className="w-full h-auto"
        />
      </ImageViewer>
      <HandlesArray nodeId={id} />
    </div>
  );
}
