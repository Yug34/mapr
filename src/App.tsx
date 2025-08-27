import { useState, useCallback } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
} from "@xyflow/react";

import type { Connection, EdgeChange, NodeChange, Node } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { Plus } from "lucide-react";

type CustomNode = Node<{ label: string }>;

const initialNodes: CustomNode[] = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
];
const initialEdges = [{ id: "n1-n2", source: "n1", target: "n2" }];

function App() {
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
    <div className="w-screen h-screen flex flex-row overflow-hidden">
      <div className="w-[200px] h-full bg-red-500 flex-shrink-0">Panel</div>
      <div className="flex flex-col flex-1 min-h-0">
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
        <div className="flex flex-row w-full h-8 bg-blue-500 flex-shrink-0">
          <div className="">Tab 1</div>
          <div className="">Tab 1</div>
          <div className="">
            <Plus />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
