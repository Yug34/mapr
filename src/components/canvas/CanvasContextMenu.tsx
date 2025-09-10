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
import { ClipboardCheck, Copy, CopyPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

  const [recentlyCopied, setRecentlyCopied] = useState(false);

  const handleCopyId = useCallback(() => {
    if (!targetId) return;
    navigator.clipboard.writeText(targetId);
    setRecentlyCopied(true);
    setTimeout(() => setRecentlyCopied(false), 1500);
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

  return (
    <>
      <ContextMenuContent>
        {type === "node" ? (
          <>
            <ContextMenuLabel>Node: {targetId}</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleCopyId}>
              {recentlyCopied ? (
                <ClipboardCheck className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
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
            <ContextMenuLabel>Canvas</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={addTextNode}>
              <CopyPlus className="size-4" />
              Add Text Node Here
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </>
  );
};

export default CanvasContextMenu;
