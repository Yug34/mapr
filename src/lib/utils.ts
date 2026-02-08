import type {
  AudioNodeData,
  ImageNodeData,
  MediaHandler,
  PDFNodeData,
  VideoNodeData,
} from "@/types/common";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract a safe string from an unknown error. */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Strip the last file extension for use as a display name (e.g. "photo.png" → "photo"). */
export function stripFileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0) return name;
  return name.slice(0, i);
}

function createMediaHandler(
  type: "ImageNode" | "VideoNode" | "AudioNode" | "PDFNode",
  test: (mime: string) => boolean,
  fileKey: string,
  urlKey: string,
  base64Key: string
): MediaHandler<ImageNodeData | VideoNodeData | AudioNodeData | PDFNodeData> {
  return {
    test,
    type,
    buildData: (file, url, b64) =>
      ({
        fileName: file.name,
        [fileKey]: file,
        [urlKey]: url,
        [base64Key]: b64,
      }) as unknown as ImageNodeData | VideoNodeData | AudioNodeData | PDFNodeData,
  };
}

export const MEDIA_HANDLERS: MediaHandler<
  ImageNodeData | VideoNodeData | AudioNodeData | PDFNodeData
>[] = [
  createMediaHandler("ImageNode", (t) => t.startsWith("image/"), "image", "imageBlobUrl", "imageBase64"),
  createMediaHandler("VideoNode", (t) => t.startsWith("video/"), "video", "videoBlobUrl", "videoBase64"),
  createMediaHandler("AudioNode", (t) => t.startsWith("audio/"), "audio", "audioBlobUrl", "audioBase64"),
  createMediaHandler("PDFNode", (t) => t === "application/pdf", "pdf", "pdfBlobUrl", "pdfBase64"),
];
