import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import type { NodeChange, EdgeChange, Connection } from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { nodeTypes } from "../types/common";
import type { CustomNode } from "../types/common";
import { isLink } from "../utils";

const Canvas = () => {
  const { nodes, edges, setNodes, setEdges, addNode } = useCanvasStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("paste", (e: ClipboardEvent) => {
        const text = e.clipboardData?.getData("text");

        if (text) {
          if (isLink(text)) {
            const webPageNode: CustomNode = {
              id: crypto.randomUUID(),
              type: "WebPageNode",
              position: { x: 0, y: 0 },
              data: { url: text },
            };
            addNode(webPageNode);
          } else {
            const textNode: CustomNode = {
              id: crypto.randomUUID(),
              position: { x: 0, y: 0 },
              data: { label: text },
            };
            addNode(textNode);
          }
        }
      });

      // Add click handler to ensure canvas gets focus
      canvas.addEventListener("click", () => {
        canvas.focus();
      });
    }

    return () => {
      canvas?.removeEventListener("paste", (e) => {
        console.log(e.clipboardData?.getData("text"));
      });
      canvas?.removeEventListener("click", () => {
        canvas.focus();
      });
    };
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange<CustomNode>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  return (
    <div
      ref={canvasRef}
      className="flex-1 min-h-0"
      tabIndex={0}
      style={{ outline: "none" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        style={{
          background: `
              radial-gradient(circle, #a0a0a0 1px, transparent 1px)
            `,
          backgroundSize: "20px 20px",
        }}
        nodeTypes={nodeTypes}
      >
        <MiniMap
          style={{
            height: 120,
            width: 180,
          }}
          nodeColor={(node) => {
            // TODO:
            switch (node.type) {
              case "input":
                return "#0041d0";
              case "output":
                return "#ff0072";
              default:
                return "#1a192b";
            }
          }}
          nodeStrokeWidth={3}
        />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
