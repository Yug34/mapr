import { TextUpdaterNode } from "../components/nodes/TextUpdaterNode";
import type { Node } from "@xyflow/react";

export const nodeTypes = {
  textUpdater: TextUpdaterNode,
};

export type CustomNode = Node<{ label: string }>;
