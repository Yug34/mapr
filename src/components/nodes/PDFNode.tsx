import { Handle, Position } from "@xyflow/react";
import type { PDFNodeData } from "../../types/common";
import { Card } from "../ui/card";
import { Document, Page, pdfjs } from "react-pdf";
import { useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export function PDFNode(NodeData: PDFNodeData) {
  const { data } = NodeData;
  const [numPages, setNumPages] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const onDocumentLoadSuccess = ({
    numPages: nextNumPages,
  }: PDFDocumentProxy): void => {
    setNumPages(nextNumPages);
  };

  const MAX_WIDTH = 800;

  return (
    <Card className="p-4">
      <div className="text-sm font-medium">{data.fileName}</div>
      <div
        className="flex flex-col items-center justify-center"
        ref={containerRef}
      >
        <Document file={data.pdfBase64} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (_el, index) => (
            <Page
              key={`page_${index + 1}`}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              pageNumber={index + 1}
              width={
                containerRef.current?.clientWidth
                  ? Math.min(containerRef.current?.clientWidth, MAX_WIDTH)
                  : MAX_WIDTH
              }
            />
          ))}
        </Document>
        <Handle type="source" position={Position.Top} />
        <Handle type="target" position={Position.Bottom} />
      </div>
    </Card>
  );
}
