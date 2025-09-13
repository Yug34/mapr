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

export const MEDIA_HANDLERS: MediaHandler<
  ImageNodeData | VideoNodeData | AudioNodeData | PDFNodeData
>[] = [
  {
    test: (t) => t.startsWith("image/"),
    type: "ImageNode",
    buildData: (file, url, b64) => ({
      fileName: file.name,
      image: file,
      imageBlobUrl: url,
      imageBase64: b64,
    }),
  },
  {
    test: (t) => t.startsWith("video/"),
    type: "VideoNode",
    buildData: (file, url, b64) => ({
      fileName: file.name,
      video: file,
      videoBlobUrl: url,
      videoBase64: b64,
    }),
  },
  {
    test: (t) => t.startsWith("audio/"),
    type: "AudioNode",
    buildData: (file, url, b64) => ({
      fileName: file.name,
      audio: file,
      audioBlobUrl: url,
      audioBase64: b64,
    }),
  },
  {
    test: (t) => t === "application/pdf",
    type: "PDFNode",
    buildData: (file, url, b64) => ({
      fileName: file.name,
      pdf: file,
      pdfBlobUrl: url,
      pdfBase64: b64,
    }),
  },
];
