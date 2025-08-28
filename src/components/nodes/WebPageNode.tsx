import { Handle, Position } from "@xyflow/react";

// https://web.mit.edu/6.001/6.037/sicp.pdf

export function WebPageNode() {
  return (
    <div className="web-page-node">
      <div className="">Webpage URL</div>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
