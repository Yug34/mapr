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
  const { updateNodeData } = useCanvas();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-1 flex w-[360px] max-w-full items-center justify-center gap-1.5">
        <div className="min-w-0 flex-1 rounded border bg-white px-2 py-1 text-center text-xs font-semibold">
          <EditableNodeTitle
            displayValue={nodeData.title ?? nodeData.fileName}
            onSave={(value) =>
              updateNodeData(id, {
                title: value || undefined,
              } as Partial<ImageNodeData>)
            }
            title={nodeData.fileName}
          />
        </div>
        {status === "extracting" && (
          <span
            className="shrink-0 text-xs text-muted-foreground"
            title="Extracting text…"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </span>
        )}
        {status === "done" && (
          <span className="shrink-0 text-green-600" title="Text extracted">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
        {status === "error" && (
          <span
            className="shrink-0 text-destructive"
            title={errorMsg ?? "Extraction failed"}
          >
            <AlertCircle className="h-3.5 w-3.5" />
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
