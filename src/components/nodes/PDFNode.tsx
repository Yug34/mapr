import { Handle, Position } from "@xyflow/react";
import type { PDFNodeData } from "../../types/common";
import { Card } from "../ui/card";

export function PDFNode(NodeData: PDFNodeData) {
  const { data } = NodeData;

  return (
    <Card className="p-4">
      <div className="text-sm font-medium">{data.fileName}</div>
      <div className="flex flex-col items-center justify-center">
        <embed src={data.pdfBlobUrl} type="application/pdf" />
        <Handle type="source" position={Position.Top} />
        <Handle type="target" position={Position.Bottom} />
      </div>
    </Card>
  );
}
