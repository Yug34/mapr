import { useCallback } from "react";
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

const Canvas = () => {
  const { nodes, edges, setNodes, setEdges } = useCanvasStore();

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
    <div className="flex-1 min-h-0">
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
