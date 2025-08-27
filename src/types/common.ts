import { TextUpdaterNode } from "../components/nodes/TextUpdaterNode";

export const nodeTypes = {
  textUpdater: TextUpdaterNode,
};

export const initialNodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "Hello World" },
  },
  {
    id: "2",
    position: { x: 100, y: 100 },
    data: { label: "Hello World 2" },
  },
];
