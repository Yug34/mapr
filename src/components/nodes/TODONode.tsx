import type { NodeProps } from "@xyflow/react";
import type { Todo, TODONodeData } from "../../types/common";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  CalendarIcon,
  EditIcon,
  Pencil,
  TrashIcon,
  XIcon,
  AlertTriangle,
} from "lucide-react";
import { EditableNodeTitle } from "@/components/ui/editable-node-title";
import { HandlesArray } from "../../utils/components";
import { useCanvas } from "../../hooks/useCanvas";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format, isToday } from "date-fns";
import { Input } from "../ui/input";

export function TODONode(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as TODONodeData;

  const [title, setTitle] = useState(nodeData.title ?? "TODO");
  const [todos, setTodos] = useState<Todo[]>(nodeData.todos);
  const [dueDate, setDueDate] = useState<number | undefined>(nodeData.dueDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { updateNodeData } = useCanvas();
  const isDueToday = dueDate ? isToday(new Date(dueDate)) : false;

  useEffect(() => {
    setDueDate(nodeData.dueDate);
  }, [nodeData.dueDate]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const updateNodeTodos = useCallback(
    (nextTodos: Todo[]) => {
      setTodos(nextTodos);
      updateNodeData(id, { todos: nextTodos } as TODONodeData);
    },
    [id, updateNodeData]
  );

  const updateNodeTitle = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      updateNodeData(id, { title: newTitle, todos } as TODONodeData);
    },
    [id, todos, updateNodeData]
  );

  const updateNodeDueDate = useCallback(
    (newDueDate: number | undefined) => {
      setDueDate(newDueDate);
      updateNodeData(id, { dueDate: newDueDate } as TODONodeData);
      setIsDatePickerOpen(false);
    },
    [id, updateNodeData]
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
        <div className="px-3 py-2 rounded-t-md border-b bg-muted/30 flex w-full text-sm font-medium items-center justify-center gap-2 min-h-[2.5rem]">
          <EditableNodeTitle
            displayValue={title}
            onSave={(value) => updateNodeTitle(value.trim() || "TODO")}
            title={title}
          />
        </div>
        <div
          className={cn(
            "px-3 py-1.5 border-b bg-muted/20 flex w-full text-xs items-center gap-2 min-h-[2rem]",
            isDueToday && "bg-red-500 text-white"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            {!dueDate ? (
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left rounded border border-gray-400 hover:bg-accent/50 px-1 py-0.5 -mx-1 text-muted-foreground italic"
                >
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                  Set due date
                </Button>
              </PopoverTrigger>
            ) : (
              <div className={"w-full flex items-center justify-between gap-2"}>
                <span className="flex items-center gap-1.5">
                  Due by <b>{format(new Date(dueDate), "MMM d, yyyy")}</b>
                  {isDueToday && <AlertTriangle />}
                </span>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-black rounded-r-none"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 rounded-l-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateNodeDueDate(undefined);
                      }}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </PopoverTrigger>
              </div>
            )}
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate ? new Date(dueDate) : undefined}
                onSelect={(date) =>
                  updateNodeDueDate(date ? date.getTime() : undefined)
                }
                autoFocus
              />
              {dueDate && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => updateNodeDueDate(undefined)}
                  >
                    <XIcon className="h-3.5 w-3.5 mr-1" />
                    Clear due date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        {todos.map((todo: Todo) => (
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
                "dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
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
