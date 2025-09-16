import type { NodeProps } from "@xyflow/react";
import type { Todo, TODONodeData } from "../../types/common";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { EditIcon, TrashIcon } from "lucide-react";
import { HandlesArray } from "../../utils/components";
import { useCanvasStore } from "../../store/canvasStore";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";

export function TODONode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as TODONodeData;

  const [todos, setTodos] = useState<Todo[]>(nodeData.todos);
  const { setNodes } = useCanvasStore();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const updateNodeTodos = useCallback(
    (nextTodos: Todo[]) => {
      setTodos(nextTodos);
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...(node.data as TODONodeData),
                  todos: nextTodos,
                },
              }
            : node
        )
      );
    },
    [id, setNodes]
  );

  const addTodo = useCallback(() => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: "New Todo",
      completed: false,
    };
    updateNodeTodos([...todos, newTodo]);
  }, [todos, updateNodeTodos]);

  const handleTodoClick = (
    e: React.MouseEvent<HTMLDivElement>,
    todoNode: Todo
  ) => {
    e.preventDefault();
    e.stopPropagation();
    updateNodeTodos(
      todos.map((t: Todo) =>
        t.id === todoNode.id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const handleTodoEdit = (
    e: React.MouseEvent<HTMLButtonElement>,
    todoNode: Todo
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTodoId(todoNode.id);
    setEditingTitle(todoNode.title);
    setEditDialogOpen(true);
  };

  const handleTodoDelete = (
    e: React.MouseEvent<HTMLButtonElement>,
    todoNode: Todo
  ) => {
    e.preventDefault();
    e.stopPropagation();
    updateNodeTodos(todos.filter((t: Todo) => t.id !== todoNode.id));
  };

  return (
    <div className="max-w-[300px] w-[300px] min-w-[300px] flex flex-col items-center justify-center">
      <Card className="w-full p-0 border-none rounded-md gap-0">
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
                "flex items-center cursor-pointer w-full gap-3 border p-3 rounded-none hover:bg-accent/50",
                "has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50",
                "dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950",
                index === 0 && "rounded-t-md"
              )}
            >
              <Checkbox
                id={todo.id}
                className="cursor-pointer flex items-center gap-2"
                checked={todo.completed}
              />
              <div className="grid gap-1 font-normal">
                <p className="text-xs leading-none font-medium">{todo.title}</p>
              </div>
              <div className="ml-auto shrink-0">
                <Button
                  onClick={(e) => {
                    handleTodoEdit(e, todo);
                  }}
                  className="cursor-pointer w-[6px] h-[6px] p-3 rounded-sm rounded-r-none"
                >
                  <EditIcon
                    className="text-xs"
                    style={{ width: "12px", height: "12px" }}
                  />
                </Button>
                <Button
                  variant="destructive"
                  onClick={(e) => {
                    handleTodoDelete(e, todo);
                  }}
                  className="cursor-pointer w-[6px] h-[6px] p-3 rounded-sm rounded-l-none"
                >
                  <TrashIcon
                    className="text-xs"
                    style={{ width: "12px", height: "12px" }}
                  />
                </Button>
              </div>
            </Label>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-full rounded-t-none rounded-b-md cursor-pointer"
          onClick={addTodo}
        >
          Add Todo
        </Button>
      </Card>
      <HandlesArray nodeId={id} />
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit todo</DialogTitle>
          </DialogHeader>
          <Input
            value={editingTitle}
            autoFocus
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!editingTodoId) return;
                const title = editingTitle.trim();
                updateNodeTodos(
                  todos.map((t) =>
                    t.id === editingTodoId ? { ...t, title } : t
                  )
                );
                setEditDialogOpen(false);
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editingTodoId) return;
                const title = editingTitle.trim();
                updateNodeTodos(
                  todos.map((t) =>
                    t.id === editingTodoId ? { ...t, title } : t
                  )
                );
                setEditDialogOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
