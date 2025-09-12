import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { NoteNodeData } from "../../types/common";
import { useEffect } from "react";

export function NoteNode(props: NodeProps) {
  const { data } = props;

  useEffect(() => {
    console.log(data);
  }, []);

  const nodeData = data as NoteNodeData;
  return (
    <div className="sticky-note sticky-note-one">
      <div className="font-semibold mb-1">{nodeData.title}</div>
      {nodeData.content ? (
        <div className="whitespace-pre-wrap leading-relaxed w-full pb-2 min-h-[100px]">
          {nodeData.content}
        </div>
      ) : (
        <div className="whitespace-pre-wrap leading-relaxed">No content</div>
      )}
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
