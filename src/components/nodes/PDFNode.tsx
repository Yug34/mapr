import { Handle, Position } from "@xyflow/react";
import type { PDFNodeData } from "../../types/common";
import { Card } from "../ui/card";
import { Document, Page, pdfjs } from "react-pdf";
import { useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "../ui/button";
import { Minus, Plus, SquareArrowOutUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export function PDFNode(NodeData: PDFNodeData) {
  const { data } = NodeData;
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
  };

  const openPdfInNewTab = () => {
    window.open(data.pdfBlobUrl, "_blank");
  };

  return (
    <>
      <Dialog modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full h-full max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{data.fileName}</DialogTitle>
          </DialogHeader>
          <Document file={data.pdfBase64} onLoadSuccess={() => {}}>
            {Array.from(new Array(numPages), (_el, index) => (
              <Page
                key={`page_${index + 1}`}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                pageNumber={index + 1}
              />
            ))}
          </Document>
        </DialogContent>
      </Dialog>
      <Card className="p-4">
        <div className="flex w-full text-sm font-medium justify-between items-center">
          <span className="nowrap overflow-hidden text-ellipsis">
            {data.fileName}
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
          <Handle type="source" position={Position.Top} />
          <Handle type="target" position={Position.Bottom} />
        </div>
      </Card>
    </>
  );
}
