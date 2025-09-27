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
import { useCanvas } from "../utils/hooks";
import { nodeTypes } from "../types/common";
import type { CustomNode } from "../types/common";
import { isLink, readAsDataURL } from "../utils";
const CanvasContextMenu = lazy(() => import("./canvas/CanvasContextMenu"));
const MiniMapLazy = lazy(() =>
  import("@xyflow/react").then((m) => ({ default: m.MiniMap }))
);
const ControlsLazy = lazy(() =>
  import("@xyflow/react").then((m) => ({ default: m.Controls }))
);
import { add as idbAdd, Stores } from "../utils/indexedDb";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { MEDIA_HANDLERS } from "@/lib/utils";
import { blobManager } from "../utils/blobManager";
import { Loader } from "./ui/loader";

const Canvas = () => {
  const { nodes, edges, setNodes, setEdges, addNode, initialized, initFromDb } =
    useCanvas();

  const canvasRef = useRef<HTMLDivElement>(null);
  type MenuInfo = {
    type: "node" | "pane";
    id?: string;
    point: { x: number; y: number };
  } | null;
  const [menu, setMenu] = useState<MenuInfo>(null);

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

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      e.preventDefault();

      const items = Array.from(e.clipboardData?.items ?? []);
      const files = items
        .filter((i) => i.kind === "file")
        .map((i) => i.getAsFile())
        .filter((f): f is File => !!f);

      if (files.length) {
        const nodes = await Promise.all(
          files.map(async (file) => {
            const handler = MEDIA_HANDLERS.find((h) => h.test(file.type));
            if (!handler) return null;

            const nodeId = crypto.randomUUID();
            const blobUrl = blobManager.createBlobUrl(file, nodeId);
            const base64 = await readAsDataURL(file);

            const mediaId = crypto.randomUUID();
            await idbAdd(Stores.media, {
              id: mediaId,
              fileName: file.name,
              blob: file,
              mime: file.type,
              size: file.size,
              createdAt: Date.now(),
            });

            const node = {
              id: nodeId,
              type: handler.type,
              fileName: file.name,
              position: { x: 0, y: 0 },
              data: {
                ...handler.buildData(file, blobUrl, base64),
                mediaId,
                fileName: file.name,
              },
            } as CustomNode;

            return node;
          })
        );

        nodes.filter(Boolean).forEach((n) => addNode(n as CustomNode));
        return;
      }

      const text = e.clipboardData?.getData("text")?.trim();
      if (!text) return;

      if (isLink(text)) {
        addNode({
          id: crypto.randomUUID(),
          type: "LinkNode",
          position: { x: 0, y: 0 },
          data: { url: text },
        });
      } else {
        addNode({
          id: crypto.randomUUID(),
          type: "NoteNode",
          position: { x: 0, y: 0 },
          data: { title: "Add title", content: text },
        });
      }
    },
    [addNode]
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
      canvas.addEventListener("paste", handlePaste);
      canvas.addEventListener("click", () => canvas.focus());
    }

    return () => {
      canvas.removeEventListener("paste", handlePaste);
      canvas.removeEventListener("click", () => canvas.focus());
    };
  }, [handlePaste, initialized]);

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
  const isValidConnection = useCallback((connection: Connection | Edge) => {
    if (connection.source === connection.target) {
      return false;
    }
    return true;
  }, []);

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
        Loading <Loader />
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
          <ReactFlowProvider>
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
                minZoom: 0.5,
              }}
              zoomOnScroll
              panOnScroll={false}
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
          </ReactFlowProvider>
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
