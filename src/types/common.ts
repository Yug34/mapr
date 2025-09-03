import { TextUpdaterNode } from "../components/nodes/TextUpdaterNode";
import { WebPageNode } from "../components/nodes/WebPageNode";
import { ImageNode } from "../components/nodes/ImageNode";
import type { Node } from "@xyflow/react";
import { VideoNode } from "../components/nodes/VideoNode";
import { AudioNode } from "../components/nodes/AudioNode";
import { PDFNode } from "../components/nodes/PDFNode";

export const nodeTypes = {
  textUpdater: TextUpdaterNode,
  WebPageNode: WebPageNode,
  ImageNode: ImageNode,
  VideoNode: VideoNode,
  AudioNode: AudioNode,
  PDFNode: PDFNode,
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

export type AudioNodeData = {
  audioBlobUrl: string;
  audio: File;
  audioBase64: string;
};

export type PDFNodeData = {
  pdfBlobUrl: string;
  pdf: File;
  pdfBase64: string;
};

export type CustomNode = Node<
  | TextUpdaterNodeData
  | WebPageNodeData
  | ImageNodeData
  | VideoNodeData
  | AudioNodeData
  | PDFNodeData
>;
