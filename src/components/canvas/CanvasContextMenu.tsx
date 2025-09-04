import { useCallback, useEffect, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Edge } from "@xyflow/react";
import { useCanvasStore } from "@/store/canvasStore";
import type { CustomNode, CustomNodeData, MenuData } from "@/types/common";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClipboardCheck, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface CanvasContextMenuProps {
  menu: MenuData;
}

const CanvasContextMenu = ({ menu }: CanvasContextMenuProps) => {
  const { id, top, left, right, bottom } = menu;
  const { getNode, setNodes, setEdges } = useReactFlow<CustomNode, Edge>();
  const { addNode } = useCanvasStore();

  const [recentlyCopied, setRecentlyCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(id);
    setRecentlyCopied(true);
    setTimeout(() => setRecentlyCopied(false), 1500);

    toast.success("Copied Node ID to clipboard!");
  };

  useEffect(() => {
    console.log("menu", menu);
  }, [menu]);

  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    const position = {
      x: node!.position.x + 50,
      y: node!.position.y + 50,
    };

    addNode({
      ...(node as CustomNode),
      selected: false,
      dragging: false,
      id: `${node?.id}-copy`,
      position,
      data: node!.data as CustomNodeData,
    });
  }, [id, getNode, addNode]);

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id));
  }, [id, setNodes, setEdges]);

  return (
    <Card
      className="absolute w-[400px] h-40 z-10"
      style={{ top, left, right, bottom }}
    >
      <CardHeader>
        <Button
          variant="outline"
          onClick={copyToClipboard}
          className="cursor-pointer font-normal"
        >
          <div className="w-full flex items-start">
            <strong>Node ID:</strong> <code className="ml-2">{id}</code>
          </div>
          <div>
            {recentlyCopied ? (
              <ClipboardCheck className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </div>
        </Button>
      </CardHeader>
      <CardContent>
        <Button className="cursor-pointer" onClick={duplicateNode}>
          Duplicate
        </Button>
        <Button className="cursor-pointer" onClick={deleteNode}>
          Delete
        </Button>
      </CardContent>
    </Card>
  );
};

export default CanvasContextMenu;
