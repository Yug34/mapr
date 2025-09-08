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

export type BaseNodeData = {
  id: string;
  type: keyof typeof nodeTypes;
};

export type WebPageNodeData = BaseNodeData & {
  data: {
    url: string;
  };
};

export type TextUpdaterNodeData = BaseNodeData & {
  data: {
    label: string;
  };
};

export type ImageNodeData = BaseNodeData & {
  data: {
    imageBlobUrl: string;
    image: File;
    imageBase64: string;
    mediaId?: string;
  };
};

export type VideoNodeData = BaseNodeData & {
  data: {
    videoBlobUrl: string;
    video: File;
    videoBase64: string;
    mediaId?: string;
  };
};

export type AudioNodeData = BaseNodeData & {
  data: {
    audioBlobUrl: string;
    audio: File;
    audioBase64: string;
    mediaId?: string;
  };
};

export type PDFNodeData = BaseNodeData & {
  data: {
    pdfBlobUrl: string;
    pdf: File;
    pdfBase64: string;
    mediaId?: string;
  };
};

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type TODONodeData = BaseNodeData & {
  data: {
    title: string;
    todos: Todo[];
  };
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
