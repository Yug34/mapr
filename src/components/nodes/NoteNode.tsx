import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { NoteNodeData } from "../../types/common";

export function NoteNode(props: NodeProps) {
  const { data } = props;
  const nodeData = data as NoteNodeData;
  return (
    <div>
      <div>Note to {nodeData.title}</div>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
