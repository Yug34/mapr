import { TextUpdaterNode } from "../components/nodes/TextUpdaterNode";
import { WebPageNode } from "../components/nodes/WebPageNode";
import { ImageNode } from "../components/nodes/ImageNode";
import type { Node } from "@xyflow/react";
import { VideoNode } from "../components/nodes/VideoNode";

export const nodeTypes = {
  textUpdater: TextUpdaterNode,
  WebPageNode: WebPageNode,
  ImageNode: ImageNode,
  VideoNode: VideoNode,
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

export type VideoNodeData = {
  videoBlobUrl: string;
  video: File;
  videoBase64: string;
};

export type CustomNode = Node<
  TextUpdaterNodeData | WebPageNodeData | ImageNodeData | VideoNodeData
>;
