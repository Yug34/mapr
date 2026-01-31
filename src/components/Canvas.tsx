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
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
} from "@xyflow/react";
import type {
  NodeChange,
  EdgeChange,
  Connection,
  NodeMouseHandler,
  Edge,
} from "@xyflow/react";
import { useCanvas } from "../hooks/useCanvas";
import { nodeTypes } from "../types/common";
import type { CustomNode } from "../types/common";
import { isLink, readAsDataURL } from "../utils";
const CanvasContextMenu = lazy(() => import("./CanvasContextMenu"));
const MiniMapLazy = lazy(() =>
  import("@xyflow/react").then((m) => ({ default: m.MiniMap })),
);
const ControlsLazy = lazy(() =>
  import("@xyflow/react").then((m) => ({ default: m.Controls })),
);
import { add as dbAdd, Stores } from "../utils/sqliteDb";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { MEDIA_HANDLERS, stripFileExtension } from "@/lib/utils";
import { blobManager } from "../utils/blobManager";
import { extractAndStoreNodeText } from "@/services/extractionService";
import { Loader } from "./ui/loader";
import { Button } from "./ui/button";
import { Trash2, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FlowPosition = { x: number; y: number };

const PasteHandler = ({
  canvasRef,
  onPaste,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onPaste: (position: FlowPosition, e: ClipboardEvent) => void;
}) => {
  const { screenToFlowPosition } = useReactFlow();
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPasteEvent = (e: ClipboardEvent) => {
      const flowPosition = screenToFlowPosition(lastMouseRef.current);
      onPaste(flowPosition, e);
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("paste", onPasteEvent);
    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("paste", onPasteEvent);
    };
  }, [canvasRef, onPaste, screenToFlowPosition]);

  return null;
};

const Canvas = () => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    deleteNode,
    initialized,
    initFromDb,
    resetToInitialState,
    isNoteNodeEditing,
  } = useCanvas();
  const [resetLoading, setResetLoading] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  type MenuInfo = {
    type: "node" | "pane";
    id?: string;
    point: { x: number; y: number };
  } | null;
  const [menu, setMenu] = useState<MenuInfo>(null);

  const DeleteHandler = () => {
    const { getNodes } = useReactFlow();

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          const selectedNodes = getNodes().filter((node) => node.selected);
          if (selectedNodes.length > 0) {
            e.preventDefault();
            selectedNodes.forEach((node) => deleteNode(node.id));
          }
        }
      },
      [getNodes],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.addEventListener("keydown", handleKeyDown);
      return () => canvas.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return null;
  };

  const WheelPanInverter = () => {
    const { getViewport, setViewport } = useReactFlow();

    useEffect(() => {
      const el = canvasRef.current;
      if (!el) return;

      const onWheel = (e: WheelEvent) => {
        // Trackpad: deltaMode === 0 (pixels). Mouse wheel: typically line/page.
        const isPixel = e.deltaMode === 0;

        // Allow pinch-zoom (ctrl/meta) to be handled by React Flow even on trackpad
        const wantsZoom = e.ctrlKey || e.metaKey;

        if (e.shiftKey) {
          // horizontal pan
          const dx = -e.deltaY * 0.4;
          const dy = 0;

          e.preventDefault();
          e.stopPropagation();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e as any).stopImmediatePropagation?.();
          const vp = getViewport();
          setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom });
          return;
        }

        if (isPixel && !wantsZoom) {
          // vertical pan
          const dx = -e.deltaX * 0.4;
          const dy = -e.deltaY * 0.4;

          e.preventDefault();
          e.stopPropagation();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e as any).stopImmediatePropagation?.();
          const vp = getViewport();
          setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom });
          return;
        }
        // Non-pixel (mouse wheel) or ctrl/meta pressed: let React Flow zoom/scroll
      };

      el.addEventListener("wheel", onWheel, { passive: false, capture: true });
      return () => el.removeEventListener("wheel", onWheel as EventListener);
    }, [getViewport, setViewport]);

    return null;
  };

  const handlePasteWithPosition = useCallback(
    async (position: FlowPosition, e: ClipboardEvent) => {
      e.preventDefault();

      const items = Array.from(e.clipboardData?.items ?? []);
      const files = items
        .filter((i) => i.kind === "file")
        .map((i) => i.getAsFile())
        .filter((f): f is File => !!f);

      if (files.length) {
        const nodes = await Promise.all(
          files.map(async (file, i) => {
            const handler = MEDIA_HANDLERS.find((h) => h.test(file.type));
            if (!handler) return null;

            const nodeId = crypto.randomUUID();
            const blobUrl = blobManager.createBlobUrl(file, nodeId);
            const base64 = await readAsDataURL(file);

            const mediaId = crypto.randomUUID();
            await dbAdd(Stores.media, {
              id: mediaId,
              fileName: file.name,
              blob: file,
              mime: file.type,
              size: file.size,
              createdAt: Date.now(),
            });

            // Register Blob in blobManager so PDFNode can pass it directly to react-pdf
            blobManager.setMediaBlob(mediaId, file);

            const nodePosition = {
              x: position.x + i * 30,
              y: position.y + i * 30,
            };

            const node = {
              id: nodeId,
              type: handler.type,
              fileName: file.name,
              position: nodePosition,
              data: {
                ...handler.buildData(file, blobUrl, base64),
                mediaId,
                fileName: file.name,
                title: stripFileExtension(file.name),
              },
            } as CustomNode;

            return node;
          }),
        );

        nodes.filter(Boolean).forEach((n) => addNode(n as CustomNode));
        // Kick off text extraction for image/PDF nodes (fire-and-forget)
        nodes.forEach((n, i) => {
          if (
            n &&
            (n.type === "ImageNode" || n.type === "PDFNode") &&
            files[i]
          ) {
            void extractAndStoreNodeText(n.id, n.type, files[i]);
          }
        });
        return;
      }

      const text = e.clipboardData?.getData("text")?.trim();
      if (!text) return;

      if (isLink(text)) {
        addNode({
          id: crypto.randomUUID(),
          type: "LinkNode",
          position: { x: position.x, y: position.y },
          data: { url: text },
        });
      } else {
        addNode({
          id: crypto.randomUUID(),
          type: "NoteNode",
          position: { x: position.x, y: position.y },
          data: { title: "Add title", content: text },
        });
      }
    },
    [addNode],
  );

  useEffect(() => {
    initFromDb();
  }, [initFromDb]);

  useEffect(() => {
    return () => {
      blobManager.revokeAllBlobUrls();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    if (initialized) {
      canvas.addEventListener("click", () => canvas.focus());
    }

    return () => {
      canvas.removeEventListener("click", () => canvas.focus());
    };
  }, [initialized]);

  const onNodesChange = useCallback(
    (changes: NodeChange<CustomNode>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [setEdges],
  );
  const isValidConnection = useCallback((connection: Connection | Edge) => {
    if (connection.source === connection.target) {
      return false;
    }
    return true;
  }, []);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [setEdges],
  );

  const onNodeContextMenu = useCallback<NodeMouseHandler<CustomNode>>(
    (e, node) => {
      setMenu({
        type: "node",
        id: node.id,
        point: { x: e.clientX, y: e.clientY },
      });
    },
    [],
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
    [],
  );

  const onPaneClick = useCallback(() => {
    setMenu(null);
  }, []);

  if (!initialized) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center text-lg">
        Initializing <Loader />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <PasteHandler
        canvasRef={canvasRef}
        onPaste={handlePasteWithPosition}
      />
      <ContextMenu
        onOpenChange={(open) => {
          if (!open) setMenu(null);
        }}
      >
        <ContextMenuTrigger asChild>
          <div
            ref={canvasRef}
            className="relative flex-1 min-h-0"
            tabIndex={0}
            style={{ outline: "none" }}
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="cursor-pointer absolute left-2 top-2 z-[1000] size-9 shadow-sm"
                  aria-label="Reset to initial state"
                  title="Reset to initial state"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="z-[1000]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={resetLoading}
                    onClick={async () => {
                      setResetLoading(true);
                      try {
                        await resetToInitialState();
                      } finally {
                        setResetLoading(false);
                      }
                    }}
                  >
                    {resetLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Continue"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DeleteHandler />
            <WheelPanInverter />
            <ReactFlow
              {...{
                nodes,
                edges,
                onNodesChange,
                onEdgesChange,
                onConnect,
                isValidConnection,
                onNodeContextMenu,
                onPaneClick,
                onPaneContextMenu,
                fitView: true,
                maxZoom: 2,
                minZoom: 0.2,
              }}
              zoomOnScroll
              panOnScroll={false}
              panOnDrag={!isNoteNodeEditing}
              style={{
                background: `
                radial-gradient(circle, #a0a0a0 1px, transparent 1px)
              `,
                backgroundSize: "20px 20px",
              }}
              defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
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
    </ReactFlowProvider>
  );
};

export default Canvas;
