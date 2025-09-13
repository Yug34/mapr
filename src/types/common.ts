import { WebPageNode } from "../components/nodes/WebPageNode";
import { ImageNode } from "../components/nodes/ImageNode";
import type { Node } from "@xyflow/react";
import { VideoNode } from "../components/nodes/VideoNode";
import { AudioNode } from "../components/nodes/AudioNode";
import { PDFNode } from "../components/nodes/PDFNode";
import { TODONode } from "../components/nodes/TODONode";
import { NoteNode } from "../components/nodes/NoteNode";

export const nodeTypes = {
  WebPageNode: WebPageNode,
  ImageNode: ImageNode,
  VideoNode: VideoNode,
  AudioNode: AudioNode,
  PDFNode: PDFNode,
  TODONode: TODONode,
  NoteNode: NoteNode,
};

export type WebPageNodeData = {
  url: string;
};

export type ImageNodeData = {
  fileName: string;
  imageBlobUrl: string;
  image: File;
  imageBase64: string;
  mediaId?: string;
};

export type VideoNodeData = {
  fileName: string;
  videoBlobUrl: string;
  video: File;
  videoBase64: string;
  mediaId?: string;
};

export type AudioNodeData = {
  fileName: string;
  audioBlobUrl: string;
  audio: File;
  audioBase64: string;
  mediaId?: string;
};

export type PDFNodeData = {
  fileName: string;
  pdfBlobUrl: string;
  pdf: File;
  pdfBase64: string;
  mediaId?: string;
};

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type TODONodeData = {
  title: string;
  todos: Todo[];
};

export type NoteNodeData = {
  title: string;
  content: string;
};

export type CustomNodeData =
  | WebPageNodeData
  | ImageNodeData
  | VideoNodeData
  | AudioNodeData
  | PDFNodeData
  | TODONodeData
  | NoteNodeData;

export type CustomNode = Node<CustomNodeData>;

export type MenuData = {
  menuType: "node" | "pane";
  id?: string;
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export type MediaHandler<T> = {
  test: (mime: string) => boolean;
  type: CustomNode["type"];
  buildData: (file: File, blobUrl: string, base64: string) => T;
};
