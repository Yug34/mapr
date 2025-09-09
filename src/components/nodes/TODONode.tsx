import { Handle, Position } from "@xyflow/react";
import type { Todo, TODONodeData } from "../../types/common";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { EditIcon, TrashIcon } from "lucide-react";

export function TODONode(NodeData: { id: string; data: TODONodeData }) {
  const { data } = NodeData;

  const [todos, setTodos] = useState<Todo[]>(data.todos);

  const addTodo = useCallback(() => {
    setTodos([
      ...todos,
      { id: crypto.randomUUID(), title: "New Todo", completed: false },
    ]);
  }, [todos]);

  const handleTodoClick = (
    e: React.MouseEvent<HTMLDivElement>,
    todoNode: Todo
  ) => {
    console.log(NodeData);
    e.preventDefault();
    e.stopPropagation();
    setTodos((prevTodos: Todo[]) =>
      prevTodos.map((t: Todo) =>
        t.id === todoNode.id ? { ...t, completed: !t.completed } : t
      )
    );

    // TODO: update the db
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="p-0 border-none rounded-md gap-0 max-w-md">
        {todos.map((todo: Todo, index: number) => (
          <div
            key={todo.id}
            className="flex items-center gap-0 w-full"
            onClick={(e) => {
              handleTodoClick(e, todo);
            }}
          >
            <Label
              htmlFor={todo.id}
              className={cn(
                "cursor-pointer w-full hover:bg-accent/50 flex rounded-none items-start gap-3 border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950",
                index === 0 && "rounded-t-md"
              )}
            >
              <Checkbox
                id={todo.id}
                className="cursor-pointer flex items-center gap-2"
                checked={todo.completed}
              />
              <div className="grid gap-1.5 font-normal">
                <p className="text-sm leading-none font-medium">{todo.title}</p>
              </div>
              <div>
                <Button variant="ghost">
                  <EditIcon className="w-[6px] h-[6px] text-sm" />
                </Button>
                <Button variant="destructive">
                  <TrashIcon className="w-[6px] h-[6px] text-sm" />
                </Button>
              </div>
            </Label>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-full rounded-b-md cursor-pointer"
          onClick={addTodo}
        >
          Add Todo
        </Button>
      </Card>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
