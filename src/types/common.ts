import { LinkNode } from "../components/nodes/LinkNode";
import { ImageNode } from "../components/nodes/ImageNode";
import type { Node } from "@xyflow/react";
import { VideoNode } from "../components/nodes/VideoNode";
import { AudioNode } from "../components/nodes/AudioNode";
import { PDFNode } from "../components/nodes/PDFNode";
import { TODONode } from "../components/nodes/TODONode";
import { NoteNode } from "../components/nodes/NoteNode";

export const nodeTypes = {
  LinkNode: LinkNode,
  ImageNode: ImageNode,
  VideoNode: VideoNode,
  AudioNode: AudioNode,
  PDFNode: PDFNode,
  TODONode: TODONode,
  NoteNode: NoteNode,
};

export type LinkNodeData = {
  url: string;
  /** User-defined label; when set, shown instead of URL */
  title?: string;
  important?: boolean;
};

export type ImageNodeData = {
  fileName: string;
  /** User-defined display name; when set, shown instead of fileName */
  title?: string;
  imageBlobUrl: string;
  image: File;
  imageBase64: string;
  mediaId?: string;
  important?: boolean;
};

export type VideoNodeData = {
  fileName: string;
  title?: string;
  videoBlobUrl: string;
  video: File;
  videoBase64: string;
  mediaId?: string;
  important?: boolean;
};

export type AudioNodeData = {
  fileName: string;
  title?: string;
  audioBlobUrl: string;
  audio: File;
  audioBase64: string;
  mediaId?: string;
  important?: boolean;
};

export type PDFNodeData = {
  fileName: string;
  title?: string;
  pdfBlobUrl: string;
  pdf: File;
  pdfBase64: string;
  mediaId?: string;
  important?: boolean;
};

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export const TodoStatus = {
  Incomplete: "incomplete",
  Complete: "complete",
  Overdue: "overdue",
} as const;

export type TodoStatus = (typeof TodoStatus)[keyof typeof TodoStatus];

export type TODONodeData = {
  title: string;
  todos: Todo[];
  dueDate?: number;
  status?: TodoStatus;
  important?: boolean;
};

export type NoteNodeData = {
  title: string;
  content: string;
  important?: boolean;
};

export type CustomNodeData =
  | LinkNodeData
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

// Dock / Tabs
export type TabIconKey =
  | "home"
  | "star"
  | "bolt"
  | "folder"
  | "atom"
  | "globe"
  | "bookOpen"
  | "focus"
  | "flower"
  | "medal";
