import { Handle, Position } from "@xyflow/react";
import type { TODONodeData } from "../../types/common";

export function TODONode(NodeData: { data: TODONodeData }) {
  const { data } = NodeData;

  return (
    <div className="flex flex-col items-center justify-center">
      <div>
        {data.todos.map((todo) => (
          <div key={todo.id}>
            {todo.title} {todo.completed ? "✅" : "❌"}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
