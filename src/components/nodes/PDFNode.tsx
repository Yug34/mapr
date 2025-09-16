import type { NodeProps } from "@xyflow/react";
import type { PDFNodeData } from "../../types/common";
import { Card } from "../ui/card";
import { Document, Page, pdfjs } from "react-pdf";
import { useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "../ui/button";
import { Minus, Plus, SquareArrowOutUpRight } from "lucide-react";
import { HandlesArray } from "../../utils/components";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export function PDFNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as PDFNodeData;
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

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
  };

  const MAX_WIDTH = 800;

  const openPdfInNewTab = () => {
    window.open(nodeData.pdfBlobUrl, "_blank");
  };

  return (
    <Card className="p-4">
      <div className="flex w-full text-sm font-medium justify-between items-center">
        <span className="nowrap overflow-hidden text-ellipsis">
          {nodeData.fileName}
        </span>
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
        <Document
          className="cursor-pointer"
          file={nodeData.pdfBase64 ? nodeData.pdfBase64 : nodeData.pdfBlobUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onClick={openPdfInNewTab}
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
        </Document>
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
            <Button variant="secondary" className="rounded-none font-normal">
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
        <HandlesArray nodeId={id} />
      </div>
    </Card>
  );
}
