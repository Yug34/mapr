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

export function serializeNode(node: CustomNode, tabId: string): PersistedNode {
  const { id, type, position, data } = node as CustomNode;

  switch (type) {
    case "ImageNode": {
      const d = data as ImageNodeData;
      return {
        id,
        type,
        position,
        fileName: d.fileName,
        data: {
          mediaId: d.mediaId ?? "",
          previewBase64: d.imageBase64,
          fileName: d.fileName,
        },
        tabId,
      };
    }
    case "VideoNode": {
      const d = data as VideoNodeData;
      return {
        id,
        type,
        position,
        fileName: d.fileName,
        data: {
          mediaId: d.mediaId ?? "",
          previewBase64: d.videoBase64,
          fileName: d.fileName,
        },
        tabId,
      };
    }
    case "AudioNode": {
      const d = data as AudioNodeData;
      return {
        id,
        type,
        position,
        fileName: d.fileName,
        data: {
          mediaId: d.mediaId ?? "",
          previewBase64: d.audioBase64,
          fileName: d.fileName,
        },
        tabId,
      };
    }
    case "PDFNode": {
      const d = data as PDFNodeData;
      return {
        id,
        type,
        position,
        fileName: d.fileName,
        data: {
          mediaId: d.mediaId ?? "",
          previewBase64: d.pdfBase64,
          fileName: d.fileName,
        },
        tabId,
      };
    }
    case "LinkNode":
    default:
      return { id, type, position, data, tabId };
  }
}

export function deserializeNode(
  persisted: PersistedNode,
  blobUrlResolver: (mediaId: string) => string | undefined
): CustomNode {
  const { id, type, position } = persisted;
  const data = persisted.data as MediaNodeDataRef;

  switch (type) {
    case "ImageNode": {
      const url =
        data && "mediaId" in data ? blobUrlResolver(data.mediaId) : undefined;
      const fileNameFromData = (
        persisted.data as { fileName?: string } | undefined
      )?.fileName;
      return {
        id,
        type,
        position,
        data: {
          image: undefined as unknown as File,
          imageBlobUrl: url ?? "",
          imageBase64:
            (data as { previewBase64?: string })?.previewBase64 ?? "",
          fileName: persisted.fileName ?? fileNameFromData ?? "",
          ...(data && "mediaId" in data ? { mediaId: data.mediaId } : {}),
        } as ImageNodeData,
      } as CustomNode;
    }
    case "VideoNode": {
      const url =
        data && "mediaId" in data ? blobUrlResolver(data.mediaId) : undefined;
      const fileNameFromData = (
        persisted.data as { fileName?: string } | undefined
      )?.fileName;
      return {
        id,
        type,
        position,
        data: {
          video: undefined as unknown as File,
          videoBlobUrl: url ?? "",
          videoBase64:
            (data as { previewBase64?: string })?.previewBase64 ?? "",
          fileName: persisted.fileName ?? fileNameFromData ?? "",
          ...(data && "mediaId" in data ? { mediaId: data.mediaId } : {}),
        } as VideoNodeData,
      } as CustomNode;
    }
    case "AudioNode": {
      const url =
        data && "mediaId" in data ? blobUrlResolver(data.mediaId) : undefined;
      const fileNameFromData = (
        persisted.data as { fileName?: string } | undefined
      )?.fileName;
      return {
        id,
        type,
        position,
        data: {
          audio: undefined as unknown as File,
          audioBlobUrl: url ?? "",
          audioBase64:
            (data as { previewBase64?: string })?.previewBase64 ?? "",
          fileName: persisted.fileName ?? fileNameFromData ?? "",
          ...(data && "mediaId" in data ? { mediaId: data.mediaId } : {}),
        } as AudioNodeData,
      } as CustomNode;
    }
    case "PDFNode": {
      const url =
        data && "mediaId" in data ? blobUrlResolver(data.mediaId) : undefined;

      const fileNameFromData = (
        persisted.data as { fileName?: string } | undefined
      )?.fileName;
      return {
        id,
        type,
        position,
        data: {
          pdf: undefined as unknown as File,
          pdfBlobUrl: url ?? "",
          pdfBase64: (data as { previewBase64?: string })?.previewBase64 ?? "",
          fileName: persisted.fileName ?? fileNameFromData ?? "",
          ...(data && "mediaId" in data ? { mediaId: data.mediaId } : {}),
        } as PDFNodeData,
      } as CustomNode;
    }
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
