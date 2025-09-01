import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import type { NodeChange, EdgeChange, Connection } from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { nodeTypes } from "../types/common";
import type { CustomNode } from "../types/common";
import { isLink } from "../utils";
import FileUpload from "./FileUpload";

const Canvas = () => {
  const { nodes, edges, setNodes, setEdges, addNode, dragging, setDragging } =
    useCanvasStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  const handlePaste = async (e: ClipboardEvent) => {
    e.preventDefault();

    if (e.clipboardData?.types.includes("text/plain")) {
      const text = e.clipboardData?.getData("text");
      if (text) {
        if (isLink(text)) {
          const webPageNode: CustomNode = {
            id: crypto.randomUUID(),
            type: "WebPageNode",
            position: { x: 0, y: 0 },
            data: { url: text },
          };
          addNode(webPageNode);
        } else {
          const textNode: CustomNode = {
            id: crypto.randomUUID(),
            position: { x: 0, y: 0 },
            data: { label: text },
          };
          addNode(textNode);
        }
      }
    } else {
      const items = e.clipboardData?.items ?? [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            const reader = new FileReader();

            reader.onload = async (e) => {
              const base64String = e.target?.result;
              if (base64String) {
                const imageNode: CustomNode = {
                  id: crypto.randomUUID(),
                  type: "ImageNode",
                  position: { x: 0, y: 0 },
                  data: {
                    image: file,
                    imageBlobUrl: url,
                    imageBase64: base64String as string,
                  },
                };
                console.log({
                  image: file,
                  imageBlobUrl: url,
                  imageBase64: base64String as string,
                });
                addNode(imageNode);
              }
            };

            reader.readAsDataURL(file);
          }
        } else if (items[i].type.startsWith("video/")) {
          const file = items[i].getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            const reader = new FileReader();

            reader.onload = async (e) => {
              const base64String = e.target?.result;
              if (base64String) {
                const videoNode: CustomNode = {
                  id: crypto.randomUUID(),
                  type: "VideoNode",
                  position: { x: 0, y: 0 },
                  data: {
                    video: file,
                    videoBlobUrl: url,
                    videoBase64: base64String as string,
                  },
                };
                console.log({
                  video: file,
                  videoBlobUrl: url,
                  videoBase64: base64String as string,
                });
                addNode(videoNode);
              }
            };

            reader.readAsDataURL(file);
          }
        } else if (items[i].type.startsWith("audio/")) {
          const file = items[i].getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            const reader = new FileReader();

            reader.onload = async (e) => {
              const base64String = e.target?.result;
              if (base64String) {
                const audioNode: CustomNode = {
                  id: crypto.randomUUID(),
                  type: "AudioNode",
                  position: { x: 0, y: 0 },
                  data: {
                    audio: file,
                    audioBlobUrl: url,
                    audioBase64: base64String as string,
                  },
                };
                console.log({
                  audio: file,
                  audioBlobUrl: url,
                  audioBase64: base64String as string,
                });
                addNode(audioNode);
              }
            };

            reader.readAsDataURL(file);
          }
        }
      }
    }
  };

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

    if (canvas) {
      canvas.addEventListener("paste", handlePaste);
      canvas.addEventListener("click", () => canvas.focus());
      canvas.addEventListener("dragenter", handleDragEnter);
      canvas.addEventListener("drop", handleDrop);
    }

    return () => {
      canvas?.removeEventListener("paste", handlePaste);
      canvas?.removeEventListener("click", () => canvas.focus());
      canvas?.removeEventListener("dragenter", handleDragEnter);
      canvas?.removeEventListener("drop", handleDrop);
    };
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange<CustomNode>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
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
