import type { Edge } from "@xyflow/react";
import type {
  AudioNodeData,
  CustomNode,
  ImageNodeData,
  PDFNodeData,
  VideoNodeData,
  LinkNodeData,
} from "../types/common";

// On-disk representations: no File objects, no Blob URLs.
export type PersistedNode = {
  id: string;
  fileName?: string;
  type?: CustomNode["type"];
  position: { x: number; y: number };
  data: unknown;
  tabId: string;
};

export type PersistedEdge = Edge & { tabId: string };

export type MediaLike = {
  id: string;
  mime: string;
  size: number;
};

// Extract media reference fields
type MediaNodeDataRef =
  | { mediaId: string; previewBase64?: string }
  | LinkNodeData;

type MediaNodeData = ImageNodeData | VideoNodeData | AudioNodeData | PDFNodeData;

function serializeMediaNode(
  node: CustomNode,
  tabId: string,
  base64Key: "imageBase64" | "videoBase64" | "audioBase64" | "pdfBase64"
): PersistedNode {
  const { id, type, position, data } = node;
  const d = data as MediaNodeData;
  return {
    id,
    type,
    position,
    fileName: d.fileName,
    data: {
      mediaId: d.mediaId ?? "",
      previewBase64: (d as Record<string, unknown>)[base64Key] ?? "",
      fileName: d.fileName,
      ...(d.title != null && d.title !== "" ? { title: d.title } : {}),
      ...(d.important ? { important: true } : {}),
    },
    tabId,
  };
}

export function serializeNode(node: CustomNode, tabId: string): PersistedNode {
  const { id, type, position, data } = node as CustomNode;

  switch (type) {
    case "ImageNode":
      return serializeMediaNode(node, tabId, "imageBase64");
    case "VideoNode":
      return serializeMediaNode(node, tabId, "videoBase64");
    case "AudioNode":
      return serializeMediaNode(node, tabId, "audioBase64");
    case "PDFNode":
      return serializeMediaNode(node, tabId, "pdfBase64");
    case "LinkNode":
    default:
      return { id, type, position, data, tabId };
  }
}

type PersistedMediaData = {
  fileName?: string;
  title?: string;
  important?: boolean;
  previewBase64?: string;
  mediaId?: string;
};

function parsePersistedMediaData(persisted: PersistedNode): PersistedMediaData {
  const raw = persisted.data as Record<string, unknown> | undefined;
  return {
    fileName: (raw?.fileName ?? persisted.fileName) as string | undefined,
    title: raw?.title as string | undefined,
    important: raw?.important as boolean | undefined,
    previewBase64: raw?.previewBase64 as string | undefined,
    mediaId: raw?.mediaId as string | undefined,
  };
}

function deserializeMediaNode(
  persisted: PersistedNode,
  blobUrlResolver: (mediaId: string) => string | undefined,
  config: {
    fileKey: string;
    urlKey: string;
    base64Key: string;
  }
): CustomNode {
  const { id, type, position } = persisted;
  const data = persisted.data as MediaNodeDataRef;
  const parsed = parsePersistedMediaData(persisted);

  const url =
    data && "mediaId" in data && data.mediaId
      ? blobUrlResolver(data.mediaId)
      : undefined;

  const nodeData: Record<string, unknown> = {
    [config.fileKey]: undefined,
    [config.urlKey]: url ?? "",
    [config.base64Key]: parsed.previewBase64 ?? "",
    fileName: persisted.fileName ?? parsed.fileName ?? "",
    ...(parsed.title != null && parsed.title !== ""
      ? { title: parsed.title }
      : {}),
    ...(data && "mediaId" in data ? { mediaId: data.mediaId } : {}),
    ...(parsed.important ? { important: true } : {}),
  };

  return { id, type, position, data: nodeData } as CustomNode;
}

export function deserializeNode(
  persisted: PersistedNode,
  blobUrlResolver: (mediaId: string) => string | undefined
): CustomNode {
  const { id, type, position } = persisted;

  switch (type) {
    case "ImageNode":
      return deserializeMediaNode(persisted, blobUrlResolver, {
        fileKey: "image",
        urlKey: "imageBlobUrl",
        base64Key: "imageBase64",
      }) as CustomNode;
    case "VideoNode":
      return deserializeMediaNode(persisted, blobUrlResolver, {
        fileKey: "video",
        urlKey: "videoBlobUrl",
        base64Key: "videoBase64",
      }) as CustomNode;
    case "AudioNode":
      return deserializeMediaNode(persisted, blobUrlResolver, {
        fileKey: "audio",
        urlKey: "audioBlobUrl",
        base64Key: "audioBase64",
      }) as CustomNode;
    case "PDFNode":
      return deserializeMediaNode(persisted, blobUrlResolver, {
        fileKey: "pdf",
        urlKey: "pdfBlobUrl",
        base64Key: "pdfBase64",
      }) as CustomNode;
    default:
      return { id, type, position, data: persisted.data } as CustomNode;
  }
}

export function serializeEdge(edge: Edge): PersistedEdge {
  return edge as PersistedEdge;
}

export function deserializeEdge(edge: PersistedEdge): Edge {
  return edge as Edge;
}
