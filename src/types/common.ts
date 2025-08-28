import { TextUpdaterNode } from "../components/nodes/TextUpdaterNode";
import { WebPageNode } from "../components/nodes/WebPageNode";
import type { Node } from "@xyflow/react";

export const nodeTypes = {
  textUpdater: TextUpdaterNode,
  WebPageNode: WebPageNode,
};

export type WebPageNodeData = {
  url: string;
};

export type TextUpdaterNodeData = {
  label: string;
};

export type CustomNode = Node<TextUpdaterNodeData | WebPageNodeData>;
