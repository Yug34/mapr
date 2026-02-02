import type { NodeProps } from "@xyflow/react";
import type { ImageNodeData } from "../../types/common";
import { HandlesArray } from "../../utils/components";
import { ImageViewer, ImageViewerContent } from "@/components/ui/image-viewer";
import { EditableNodeTitle } from "@/components/ui/editable-node-title";
import { useExtractionStore } from "../../store/extractionStore";
import { useCanvas } from "../../hooks/useCanvas";
import { Loader2, Check, AlertCircle } from "lucide-react";

export function ImageNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as ImageNodeData;
  const status = useExtractionStore((s) => s.statusByNodeId[id]);
  const errorMsg = useExtractionStore((s) => s.errorByNodeId[id]);
  const extractedFromDb = useExtractionStore((s) => s.extractedFromDb[id]);
  const isExtracted = extractedFromDb || status === "done";
  const { updateNodeData } = useCanvas();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-1 flex w-[360px] max-w-full items-center justify-between gap-2 rounded border bg-white px-2 py-1 text-xs font-semibold">
        <EditableNodeTitle
          displayValue={nodeData.title ?? nodeData.fileName}
          onSave={(value) =>
            updateNodeData(id, {
              title: value || undefined,
            } as Partial<ImageNodeData>)
          }
          title={nodeData.fileName}
        />
        {status === "extracting" && (
          <span
            className="shrink-0 text-muted-foreground"
            title="Extracting text…"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}
        {isExtracted && (
          <span className="shrink-0 text-green-600" title="Text extracted">
            <Check className="h-4 w-4" />
          </span>
        )}
        {status === "error" && (
          <span
            className="shrink-0 text-destructive"
            title={errorMsg ?? "Extraction failed"}
          >
            <AlertCircle className="h-4 w-4" />
          </span>
        )}
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
