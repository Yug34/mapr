import { Handle, Position } from "@xyflow/react";
import type { PDFNodeData } from "../../types/common";
import { Card } from "../ui/card";
import { Document, Page, pdfjs } from "react-pdf";
import { useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "../ui/button";
import { Minus, Plus } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export function PDFNode(NodeData: PDFNodeData) {
  const { data } = NodeData;
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

  const onPDFClick = (e: MouseEvent) => {
    console.log("clicked");
  };

  return (
    <Card className="p-4">
      <div className="text-sm font-medium">{data.fileName}</div>
      <div
        className="flex flex-col items-center justify-center"
        ref={containerRef}
      >
        <Document
          file={data.pdfBase64}
          onLoadSuccess={onDocumentLoadSuccess}
          onClick={onPDFClick}
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
        <Handle type="source" position={Position.Top} />
        <Handle type="target" position={Position.Bottom} />
      </div>
    </Card>
  );
}
