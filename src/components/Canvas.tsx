import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Controls,
} from "@xyflow/react";
import type { NodeChange, EdgeChange, Connection } from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { nodeTypes } from "../types/common";
import type { CustomNode } from "../types/common";
import { isLink } from "../utils";
import FileUpload from "./FileUpload";
import type {
  PDFNodeData,
  ImageNodeData,
  VideoNodeData,
  AudioNodeData,
} from "../types/common";

const Canvas = () => {
  const { nodes, edges, setNodes, setEdges, addNode, dragging, setDragging } =
    useCanvasStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // helpers in Canvas.tsx
  const readAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  type MediaHandler<T> = {
    test: (mime: string) => boolean;
    type: CustomNode["type"];
    buildData: (file: File, blobUrl: string, base64: string) => T;
  };

  const MEDIA_HANDLERS: MediaHandler<
    ImageNodeData | VideoNodeData | AudioNodeData | PDFNodeData
  >[] = [
    {
      test: (t) => t.startsWith("image/"),
      type: "ImageNode",
      buildData: (file, url, b64) => ({
        image: file,
        imageBlobUrl: url,
        imageBase64: b64,
      }),
    },
    {
      test: (t) => t.startsWith("video/"),
      type: "VideoNode",
      buildData: (file, url, b64) => ({
        video: file,
        videoBlobUrl: url,
        videoBase64: b64,
      }),
    },
    {
      test: (t) => t.startsWith("audio/"),
      type: "AudioNode",
      buildData: (file, url, b64) => ({
        audio: file,
        audioBlobUrl: url,
        audioBase64: b64,
      }),
    },
    {
      test: (t) => t === "application/pdf",
      type: "PDFNode",
      buildData: (file, url, b64) => ({
        pdf: file,
        pdfBlobUrl: url,
        pdfBase64: b64,
      }),
    },
  ];

  // refactored handler
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      e.preventDefault();

      const items = Array.from(e.clipboardData?.items ?? []);
      const files = items
        .filter((i) => i.kind === "file")
        .map((i) => i.getAsFile())
        .filter((f): f is File => !!f);

      // Prefer files if present
      if (files.length) {
        const nodes = await Promise.all(
          files.map(async (file) => {
            const handler = MEDIA_HANDLERS.find((h) => h.test(file.type));
            if (!handler) return null;

            const blobUrl = URL.createObjectURL(file);
            const base64 = await readAsDataURL(file);

            return {
              id: crypto.randomUUID(),
              type: handler.type,
              position: { x: 0, y: 0 },
              data: handler.buildData(file, blobUrl, base64),
            } as CustomNode;
          })
        );

        nodes.filter(Boolean).forEach((n) => addNode(n as CustomNode));
        return;
      }

      // Fallback to text
      const text = e.clipboardData?.getData("text")?.trim();
      if (!text) return;

      if (isLink(text)) {
        addNode({
          id: crypto.randomUUID(),
          type: "WebPageNode",
          position: { x: 0, y: 0 },
          data: { url: text },
        });
      } else {
        addNode({
          id: crypto.randomUUID(),
          position: { x: 0, y: 0 },
          data: { label: text },
        });
      }
    },
    [addNode]
  );

  useEffect(() => {
    console.log("Dragging", dragging);
  }, [dragging]);

  useEffect(() => {
    const canvas = canvasRef.current;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setDragging(true);
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
    };

    if (!canvas) return;

    canvas.addEventListener("paste", handlePaste);
    canvas.addEventListener("click", () => canvas.focus());
    canvas.addEventListener("dragenter", handleDragEnter);
    canvas.addEventListener("drop", handleDrop);

    return () => {
      canvas.removeEventListener("paste", handlePaste);
      canvas.removeEventListener("click", () => canvas.focus());
      canvas.removeEventListener("dragenter", handleDragEnter);
      canvas.removeEventListener("drop", handleDrop);
    };
  }, [handlePaste, setDragging]);

  const onNodesChange = useCallback(
    (changes: NodeChange<CustomNode>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [setEdges]
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [setEdges]
  );

  return (
    <div
      ref={canvasRef}
      className="flex-1 min-h-0"
      tabIndex={0}
      style={{ outline: "none" }}
    >
      <FileUpload />
      <ReactFlow
        {...{
          nodes,
          edges,
          onNodesChange,
          onEdgesChange,
          onConnect,
          fitView: true,
        }}
        style={{
          background: `
              radial-gradient(circle, #a0a0a0 1px, transparent 1px)
            `,
          backgroundSize: "20px 20px",
        }}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <MiniMap
          style={{
            height: 120,
            width: 180,
          }}
          nodeColor={(node) => {
            // TODO:
            switch (node.type) {
              case "input":
                return "#0041d0";
              case "output":
                return "#ff0072";
              default:
                return "#1a192b";
            }
          }}
          nodeStrokeWidth={3}
        />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
