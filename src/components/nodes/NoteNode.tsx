import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { NoteNodeData } from "../../types/common";
import { useState } from "react";

export function NoteNode(props: NodeProps) {
  const { data } = props;
  const noteNodeData = data as NoteNodeData;

  const [nodeTitle, setNodeTitle] = useState(noteNodeData.title);
  const [nodeContent, setNodeContent] = useState(noteNodeData.content);

  return (
    <div className="sticky-note sticky-note-one">
      <input
        id="title"
        className="font-semibold mb-1 w-full break-words overflow-wrap-anywhere"
        value={nodeTitle}
        onClick={(e) => {
          e.stopPropagation();
          (e.target as HTMLInputElement).focus();
        }}
        onChange={(e) => {
          console.log(e);
          setNodeTitle(e.target.value);
        }}
        onBlur={(e) => {
          setNodeTitle(e.target.value.trim());
        }}
      />
      <textarea
        id="content"
        value={nodeContent}
        className="whitespace-pre-wrap leading-relaxed w-full pb-2 resize-none break-words overflow-wrap-anywhere"
        onClick={(e) => {
          e.stopPropagation();
          (e.target as HTMLTextAreaElement).focus();
        }}
        onChange={(e) => {
          setNodeContent(e.target.value);
        }}
        onBlur={(e) => {
          setNodeContent(e.target.value.trim());
        }}
      />
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
