import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/store/canvasStore";
import type { CustomNode, CustomNodeData } from "@/types/common";

interface ContextMenuProps {
  id: string;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const ContextMenu = ({
  id,
  top,
  left,
  right,
  bottom,
  ...props
}: ContextMenuProps) => {
  const { getNode, setNodes, setEdges } = useReactFlow();
  const { addNode } = useCanvasStore();
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
    <div
      style={{ top, left, right, bottom }}
      className="absolute z-10 bg-white border shadow-[10px_19px_20px_rgba(0,0,0,0.1)]"
      {...props}
    >
      <p className="m-2">
        <small>node: {id}</small>
      </p>
      <button
        className="border-0 block p-2 text-left w-full hover:bg-white"
        onClick={duplicateNode}
      >
        duplicate
      </button>
      <button
        className="border-0 block p-2 text-left w-full hover:bg-white"
        onClick={deleteNode}
      >
        delete
      </button>
    </div>
  );
};

export default ContextMenu;
