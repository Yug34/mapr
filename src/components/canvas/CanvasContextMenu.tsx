import { useCallback, useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Edge } from "@xyflow/react";
import { useCanvasStore } from "@/store/canvasStore";
import type { CustomNode, CustomNodeData } from "@/types/common";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  ClipboardCheck,
  Copy,
  CopyPlus,
  Trash2,
  ALargeSmall,
  ListChecks,
  File,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import FileUpload from "../FileUpload";

type MenuKind = "node" | "pane";

interface CanvasContextMenuProps {
  type: MenuKind;
  targetId?: string;
  clientPoint?: { x: number; y: number };
  onClose?: () => void;
}

const CanvasContextMenu = ({
  type,
  targetId,
  clientPoint,
  onClose,
}: CanvasContextMenuProps) => {
  const { getNode, setNodes, setEdges, screenToFlowPosition } = useReactFlow<
    CustomNode,
    Edge
  >();
  const { addNode } = useCanvasStore();
  const [addNodeType, setAddNodeType] = useState<CustomNode["type"] | null>(
    null
  );

  const handleCopyId = useCallback(() => {
    if (!targetId) return;
    navigator.clipboard.writeText(targetId);
    toast.success("Copied Node ID to clipboard!");
    onClose?.();
  }, [targetId, onClose]);

  const duplicateNode = useCallback(() => {
    if (!targetId) return;
    const node = getNode(targetId);
    if (!node) return;
    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    addNode({
      ...(node as CustomNode),
      selected: false,
      dragging: false,
      id: `${node.id}-copy`,
      position,
      data: node.data as CustomNodeData,
    });
    onClose?.();
  }, [targetId, getNode, addNode, onClose]);

  const deleteNode = useCallback(() => {
    if (!targetId) return;
    setNodes((nodes) => nodes.filter((n) => n.id !== targetId));
    setEdges((edges) =>
      edges.filter((e) => e.source !== targetId && e.target !== targetId)
    );
    onClose?.();
  }, [targetId, setNodes, setEdges, onClose]);

  const flowPoint = useMemo(() => {
    if (!clientPoint) return { x: 0, y: 0 };
    return screenToFlowPosition({ x: clientPoint.x, y: clientPoint.y });
  }, [clientPoint, screenToFlowPosition]);

  const addTextNode = useCallback(() => {
    addNode({
      id: crypto.randomUUID(),
      position: { x: flowPoint.x, y: flowPoint.y },
      data: { label: "New node" },
    });
    onClose?.();
  }, [addNode, flowPoint, onClose]);

  const addImageNode = useCallback(() => {
    addNode({
      id: crypto.randomUUID(),
      position: { x: flowPoint.x, y: flowPoint.y },
      data: { label: "New node" },
    });
    onClose?.();
  }, [addNode, flowPoint, onClose]);

  return (
    <Dialog>
      <ContextMenuContent>
        {type === "node" ? (
          <>
            <ContextMenuLabel>Node: {targetId}</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleCopyId}>
              <Copy className="size-4" />
              Copy ID
            </ContextMenuItem>
            <ContextMenuItem onClick={duplicateNode}>
              <CopyPlus className="size-4" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuItem variant="destructive" onClick={deleteNode}>
              <Trash2 className="size-4" />
              Delete
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuLabel>Add new node to Canvas</ContextMenuLabel>
            <ContextMenuSeparator />
            <DialogTrigger className="w-full">
              <ContextMenuItem
                onClick={() => setAddNodeType("text")}
                className="cursor-pointer w-full"
              >
                <ALargeSmall className="size-4" />
                Text
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setAddNodeType("FileNode")}
                className="cursor-pointer w-full"
              >
                <File className="size-4" />
                Image / Audio / Video / PDF
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setAddNodeType("TODONode")}
                className="cursor-pointer w-full"
              >
                <ListChecks className="size-4" />
                TODO
              </ContextMenuItem>
            </DialogTrigger>
          </>
        )}
      </ContextMenuContent>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {addNodeType}</DialogTitle>
        </DialogHeader>
        <FileUpload />
      </DialogContent>
    </Dialog>
  );
};

export default CanvasContextMenu;
