import type { NodeProps } from "@xyflow/react";
import type { LinkNodeData } from "../../types/common";
import { HandlesArray } from "../../utils/components";
import React from "react";
import { LinkIcon } from "lucide-react";

// https://web.mit.edu/6.001/6.037/sicp.pdf

export function LinkNode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as LinkNodeData;
  return (
    <a
      href={nodeData.url}
      className="flex items-center justify-center p-4 bg-[#e0e0e0] rounded-lg border gap-x-2"
      target="_blank"
      rel="noopener noreferrer"
    >
      <LinkIcon className="w-4 h-4" />
      <div>{nodeData.url}</div>
      <HandlesArray nodeId={id} />
    </a>
  );
}
