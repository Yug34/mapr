import { useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import type { NodeChange, EdgeChange, Connection, Node } from "@xyflow/react";

type CustomNode = Node<{ label: string }>;

const initialNodes: CustomNode[] = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
];
const initialEdges = [{ id: "n1-n2", source: "n1", target: "n2" }];

const Canvas = () => {
  // move to zustand
  const [nodes, setNodes] = useState<CustomNode[]>(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

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
