import "@xyflow/react/dist/style.css";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import type {
  NodeChange,
  EdgeChange,
  Connection,
  NodeMouseHandler,
} from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { nodeTypes } from "../types/common";
import type { CustomNode } from "../types/common";
import { isLink } from "../utils";
// import FileUpload from "./FileUpload";
import type {
  PDFNodeData,
  ImageNodeData,
  VideoNodeData,
  AudioNodeData,
} from "../types/common";
const CanvasContextMenu = lazy(() => import("./canvas/CanvasContextMenu"));
const MiniMapLazy = lazy(() =>
  import("@xyflow/react").then((m) => ({ default: m.MiniMap }))
);
const ControlsLazy = lazy(() =>
  import("@xyflow/react").then((m) => ({ default: m.Controls }))
);
import { add as idbAdd, Stores } from "../utils/indexedDb";
import { LoaderCircle } from "lucide-react";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";

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

const Canvas = () => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    dragging,
    setDragging,
    initialized,
    initFromDb,
  } = useCanvasStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  type MenuInfo = {
    type: "node" | "pane";
    id?: string;
    point: { x: number; y: number };
  } | null;
  const [menu, setMenu] = useState<MenuInfo>(null);
  // helpers in Canvas.tsx
  const readAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

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

            // persist the Blob in IDB and attach mediaId
            const mediaId = crypto.randomUUID();
            await idbAdd(Stores.media, {
              id: mediaId,
              blob: file,
              mime: file.type,
              size: file.size,
              createdAt: Date.now(),
            });

            const node = {
              id: crypto.randomUUID(),
              type: handler.type,
              position: { x: 0, y: 0 },
              data: { ...handler.buildData(file, blobUrl, base64), mediaId },
            } as CustomNode;
            return node;
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
    initFromDb();
  }, [initFromDb]);

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

    if (initialized) {
      canvas.addEventListener("paste", handlePaste);
      canvas.addEventListener("click", () => canvas.focus());
      canvas.addEventListener("dragenter", handleDragEnter);
      canvas.addEventListener("drop", handleDrop);
    }

    return () => {
      canvas.removeEventListener("paste", handlePaste);
      canvas.removeEventListener("click", () => canvas.focus());
      canvas.removeEventListener("dragenter", handleDragEnter);
      canvas.removeEventListener("drop", handleDrop);
    };
  }, [handlePaste, setDragging, initialized]);

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

  const onNodeContextMenu = useCallback<NodeMouseHandler<CustomNode>>(
    (e, node) => {
      setMenu({
        type: "node",
        id: node.id,
        point: { x: e.clientX, y: e.clientY },
      });
    },
    []
  );

  const onPaneContextMenu = useCallback(
    (e: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
      setMenu({
        type: "pane",
        point: {
          x: (e as MouseEvent).clientX,
          y: (e as MouseEvent).clientY,
        },
      });
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setMenu(null);
  }, []);

  if (!initialized) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center text-lg">
        Loading <LoaderCircle className="animate-spin ml-2" />
      </div>
    );
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) setMenu(null);
      }}
    >
      <ContextMenuTrigger asChild>
        <div
          ref={canvasRef}
          className="flex-1 min-h-0"
          tabIndex={0}
          style={{ outline: "none" }}
        >
          <ReactFlow
            {...{
              nodes,
              edges,
              onNodesChange,
              onEdgesChange,
              onConnect,
              onNodeContextMenu,
              onPaneClick,
              onPaneContextMenu,
              fitView: true,
              maxZoom: 1.5,
              minZoom: 0.5,
            }}
            style={{
              background: `
              radial-gradient(circle, #a0a0a0 1px, transparent 1px)
            `,
              backgroundSize: "20px 20px",
            }}
            nodeTypes={nodeTypes}
          >
            <Suspense fallback={null}>
              <ControlsLazy />
            </Suspense>
            <Suspense fallback={null}>
              <MiniMapLazy
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
            </Suspense>
          </ReactFlow>
        </div>
      </ContextMenuTrigger>
      <Suspense fallback={null}>
        <CanvasContextMenu
          type={menu?.type ?? "pane"}
          targetId={menu?.id}
          clientPoint={menu?.point}
          onClose={() => setMenu(null)}
        />
      </Suspense>
    </ContextMenu>
  );
};

export default Canvas;
