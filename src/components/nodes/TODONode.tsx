import { Handle, Position } from "@xyflow/react";
import type { TODONodeData } from "../../types/common";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
      <Card className="p-0 border-none rounded-md gap-0 max-w-md">
        {todos.map((todo, index) => (
          <div
            key={todo.id}
            className="flex items-center gap-0 w-full"
            onClick={(e) => {
              handleTodoClick(e, todo.id);
            }}
          >
            <Label
              htmlFor={todo.id}
              className={cn(
                "w-full hover:bg-accent/50 flex rounded-none items-start gap-3 border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950",
                index === 0 && "rounded-t-md",
                index === todos.length - 1 && "rounded-b-md"
              )}
            >
              <Checkbox
                id={todo.id}
                className="flex items-center gap-2"
                checked={todo.completed}
              />
              <div className="grid gap-1.5 font-normal">
                <p className="text-sm leading-none font-medium">{todo.title}</p>
              </div>
            </Label>
          </div>
        ))}
      </Card>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
