import { TextUpdaterNode } from "../components/nodes/TextUpdaterNode";
import { WebPageNode } from "../components/nodes/WebPageNode";
import { ImageNode } from "../components/nodes/ImageNode";
import type { Node } from "@xyflow/react";

export const nodeTypes = {
  textUpdater: TextUpdaterNode,
  WebPageNode: WebPageNode,
  ImageNode: ImageNode,
};

export type WebPageNodeData = {
  url: string;
};

export type TextUpdaterNodeData = {
  label: string;
};

export type ImageNodeData = {
  imageBlobUrl: string;
  image: File;
  imageBase64: string;
};

export type CustomNode = Node<
  TextUpdaterNodeData | WebPageNodeData | ImageNodeData
>;
