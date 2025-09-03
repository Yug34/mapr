import { Handle, Position } from "@xyflow/react";
import type { PDFNodeData } from "../../types/common";

export function PDFNode(NodeData: { data: PDFNodeData }) {
  const { data } = NodeData;
  return (
    <div className="flex flex-col items-center justify-center">
      <embed src={data.pdfBlobUrl} type="application/pdf" />
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
