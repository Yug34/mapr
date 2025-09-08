import { Handle, Position } from "@xyflow/react";
import type { TODONodeData } from "../../types/common";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { Check } from "lucide-react";

export function TODONode(NodeData: { data: TODONodeData }) {
  const { data } = NodeData;

  const [todos, setTodos] = useState(data.todos);

  const handleTodoClick = (
    e: React.MouseEvent<HTMLDivElement>,
    todoNodeId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === todoNodeId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="p-0">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-2"
            onClick={(e) => {
              handleTodoClick(e, todo.id);
            }}
          >
            <Checkbox
              id={todo.id}
              className="flex items-center gap-2"
              checked={todo.completed}
            />
            <Label htmlFor={todo.id}>{todo.title}</Label>
          </div>
        ))}
      </Card>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
