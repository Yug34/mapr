import { TextUpdaterNode } from "../components/nodes/TextUpdaterNode";
import { WebPageNode } from "../components/nodes/WebPageNode";
import { ImageNode } from "../components/nodes/ImageNode";
import type { Node } from "@xyflow/react";
import { VideoNode } from "../components/nodes/VideoNode";
import { AudioNode } from "../components/nodes/AudioNode";
import { PDFNode } from "../components/nodes/PDFNode";
import { TODONode } from "../components/nodes/TODONode";

export const nodeTypes = {
  textUpdater: TextUpdaterNode,
  WebPageNode: WebPageNode,
  ImageNode: ImageNode,
  VideoNode: VideoNode,
  AudioNode: AudioNode,
  PDFNode: PDFNode,
  TODONode: TODONode,
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
  mediaId?: string;
};

export type VideoNodeData = {
  videoBlobUrl: string;
  video: File;
  videoBase64: string;
  mediaId?: string;
};

export type AudioNodeData = {
  audioBlobUrl: string;
  audio: File;
  audioBase64: string;
  mediaId?: string;
};

export type PDFNodeData = {
  pdfBlobUrl: string;
  pdf: File;
  pdfBase64: string;
  mediaId?: string;
};

export type TODONodeData = {
  title: string;
  todos: {
    id: string;
    title: string;
    completed: boolean;
  }[];
};

export type CustomNodeData =
  | TextUpdaterNodeData
  | WebPageNodeData
  | ImageNodeData
  | VideoNodeData
  | AudioNodeData
  | PDFNodeData
  | TODONodeData;

export type CustomNode = Node<CustomNodeData>;

export type MenuData = {
  menuType: "node" | "pane";
  id?: string;
  top: number;
  left: number;
  right: number;
  bottom: number;
};
