import type { NodeProps } from "@xyflow/react";
import type { PDFNodeData } from "../../types/common";
import { Card } from "../ui/card";
import { Document, Page, pdfjs } from "react-pdf";
import { useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "../ui/button";
import {
  Minus,
  Plus,
  SquareArrowOutUpRight,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { HandlesArray } from "../../utils/components";
import { EditableNodeTitle } from "@/components/ui/editable-node-title";
import { useExtractionStore } from "../../store/extractionStore";
import { useCanvas } from "../../hooks/useCanvas";
import { blobManager } from "../../utils/blobManager";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export function PDFNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as PDFNodeData;
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const status = useExtractionStore((s) => s.statusByNodeId[id]);
  const errorMsg = useExtractionStore((s) => s.errorByNodeId[id]);
  const { updateNodeData } = useCanvas();

  const containerRef = useRef<HTMLDivElement>(null);

  // Prefer Blob from in-memory map (like IndexedDB); pdfBlobUrl is still used for "open in new tab"
  const pdfBlob = nodeData.mediaId
    ? blobManager.getMediaBlob(nodeData.mediaId)
    : undefined;

  const incPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };
  const decPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const onDocumentLoadSuccess = ({
    numPages: nextNumPages,
  }: PDFDocumentProxy): void => {
    setNumPages(nextNumPages);
    setLoadError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error("[PDFNode] Document load error:", err);
    setLoadError(err.message || "Failed to load PDF file");
  };

  const MAX_WIDTH = 800;

  const openPdfInNewTab = () => {
    window.open(nodeData.pdfBlobUrl, "_blank");
  };

  return (
    <Card className="p-4">
      <div className="flex w-full text-sm font-medium justify-between items-center gap-2">
        <EditableNodeTitle
          displayValue={nodeData.title ?? nodeData.fileName}
          onSave={(value) =>
            updateNodeData(id, {
              title: value || undefined,
            } as Partial<PDFNodeData>)
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
        {status === "done" && (
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
        <Button
          variant="outline"
          className="shrink-0 ml-2 cursor-pointer"
          size="icon"
          onClick={openPdfInNewTab}
        >
          <SquareArrowOutUpRight />
        </Button>
      </div>
      <div
        className="flex flex-col items-center justify-center"
        ref={containerRef}
      >
        {!pdfBlob && !nodeData.pdfBase64 && !nodeData.pdfBlobUrl ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            No PDF source
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-sm text-destructive font-medium">
              Failed to load PDF
            </div>
            <div className="text-xs text-muted-foreground">{loadError}</div>
          </div>
        ) : (
          <Document
            className="cursor-pointer"
            file={pdfBlob ?? nodeData.pdfBase64 ?? nodeData.pdfBlobUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          >
            <Page
              renderAnnotationLayer={false}
              renderTextLayer={false}
              pageNumber={currentPage}
              width={
                containerRef.current?.clientWidth
                  ? Math.min(containerRef.current?.clientWidth, MAX_WIDTH)
                  : MAX_WIDTH
              }
            />
            {numPages > 1 && (
              <div className="flex items-center text-sm font-medium">
                <Button
                  size="icon"
                  className="cursor-pointer rounded-r-none"
                  onClick={decPage}
                  disabled={currentPage === 1}
                >
                  <Minus />
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-none font-normal"
                >
                  Page {currentPage} of {numPages}
                </Button>
                <Button
                  size="icon"
                  className="cursor-pointer rounded-l-none"
                  onClick={incPage}
                  disabled={currentPage === numPages}
                >
                  <Plus />
                </Button>
              </div>
            )}
          </Document>
        )}
        <HandlesArray nodeId={id} />
      </div>
    </Card>
  );
}
