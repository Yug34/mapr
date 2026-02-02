import { useCallback, useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Edge } from "@xyflow/react";
import { useCanvas } from "@/hooks/useCanvas";
import type { CustomNode, CustomNodeData, TODONodeData } from "@/types/common";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Copy,
  CopyPlus,
  Trash2,
  ListChecks,
  File,
  Notebook,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import FileUpload from "./FileUpload";
import { resolveNodeText } from "@/services/nodeTextResolver";
import { summarizeWithOpenAI } from "@/services/openaiSummaryService";
import { useChatStore } from "@/store/chatStore";
import { useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";

type MenuKind = "node" | "pane";

interface CanvasContextMenuProps {
  type: MenuKind;
  targetId?: string;
  clientPoint?: { x: number; y: number };
  onClose?: () => void;
}

const CanvasContextMenu = ({
  type,
  targetId,
  clientPoint,
  onClose,
}: CanvasContextMenuProps) => {
  const { getNode, setEdges, screenToFlowPosition } = useReactFlow<
    CustomNode,
    Edge
  >();
  const { addNode, deleteNode: deleteNodeFromStore } = useCanvas();
  const { addMessage, ensureDefaultThread } = useChatStore();
  const { setOpen: setSidebarOpen } = useSidebar();
  const [addNodeType, setAddNodeType] = useState<CustomNode["type"] | null>(
    null,
  );
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<
    "summarizing" | "done" | "error"
  >("done");
  const [summaryProgress, setSummaryProgress] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [summaryError, setSummaryError] = useState("");

  const handleCopyId = useCallback(() => {
    if (!targetId) return;
    navigator.clipboard.writeText(targetId);
    toast.success("Copied Node ID to clipboard!");
    onClose?.();
  }, [targetId, onClose]);

  const duplicateNode = useCallback(() => {
    if (!targetId) return;
    const node = getNode(targetId);
    if (!node) return;
    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    addNode({
      ...(node as CustomNode),
      selected: false,
      dragging: false,
      id: `${node.id}-copy`,
      position,
      data: node.data as CustomNodeData,
    });
    onClose?.();
  }, [targetId, getNode, addNode, onClose]);

  const deleteNode = useCallback(() => {
    if (!targetId) return;
    // Use store's deleteNode method which handles blob URL cleanup
    deleteNodeFromStore(targetId);
    // Also remove edges connected to this node
    setEdges((edges) =>
      edges.filter((e) => e.source !== targetId && e.target !== targetId),
    );
    onClose?.();
  }, [targetId, deleteNodeFromStore, setEdges, onClose]);

  const flowPoint = useMemo(() => {
    if (!clientPoint) return { x: 0, y: 0 };
    return screenToFlowPosition({ x: clientPoint.x, y: clientPoint.y });
  }, [clientPoint, screenToFlowPosition]);

  const addNoteNode = useCallback(() => {
    addNode({
      id: crypto.randomUUID(),
      position: { x: flowPoint.x, y: flowPoint.y },
      type: "NoteNode",
      data: {
        title: "New note",
        content: "Lorem ipsum dolor sit sybau ts pmo icl 🥀",
      },
    });
    onClose?.();
  }, [addNode, flowPoint, onClose]);

  const addTODONode = useCallback(() => {
    addNode({
      id: crypto.randomUUID(),
      position: { x: flowPoint.x, y: flowPoint.y },
      type: "TODONode",
      data: {
        title: "New TODO",
        todos: [
          {
            id: crypto.randomUUID(),
            title: "Water the plants",
            completed: false,
          },
          {
            id: crypto.randomUUID(),
            title: "Take the trash out",
            completed: true,
          },
        ],
      } as TODONodeData,
    });
    onClose?.();
  }, [addNode, flowPoint, onClose]);

  const handleSummarize = useCallback(async () => {
    if (!targetId) return;
    const node = getNode(targetId);
    if (!node) return;
    onClose?.();

    const text = await resolveNodeText(node.id, node.type ?? "", node.data);
    if (!text || text.length < 2) {
      const isMedia = node.type === "ImageNode" || node.type === "PDFNode";
      toast.error(
        isMedia
          ? "No text available. Extraction may still be running or failed."
          : "No text to summarize.",
      );
      return;
    }

    setSummaryDialogOpen(true);
    setSummaryStatus("summarizing");
    setSummaryProgress("Summarizing...");
    setSummaryText("");
    setSummaryError("");

    try {
      const result = await summarizeWithOpenAI(text);
      setSummaryStatus("done");
      setSummaryText(result);
      setSummaryProgress(null);
      const threadId = await ensureDefaultThread();
      const sourceTitle =
        (node.data as { title?: string })?.title ?? "Node";
      await addMessage(threadId, {
        role: "summary",
        content: result,
        sourceNodeId: targetId,
        sourceTitle,
      });
      setSidebarOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSummaryStatus("error");
      setSummaryError(message);
      setSummaryProgress(null);
      toast.error(`Summarization failed: ${message}`);
    }
  }, [targetId, getNode, onClose]);

  const node = type === "node" && targetId ? getNode(targetId) : null;
  const showSummarize =
    node &&
    (node.type === "NoteNode" ||
      node.type === "ImageNode" ||
      node.type === "PDFNode");

  return (
    <>
      <Dialog>
        <ContextMenuContent>
          {type === "node" ? (
            <>
              <ContextMenuLabel>Node: {targetId}</ContextMenuLabel>
              <ContextMenuSeparator />
              {showSummarize && (
                <>
                  <ContextMenuItem onClick={handleSummarize}>
                    <FileText className="size-4" />
                    Summarize
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}
              <ContextMenuItem onClick={handleCopyId}>
                <Copy className="size-4" />
                Copy ID
              </ContextMenuItem>
              <ContextMenuItem onClick={duplicateNode}>
                <CopyPlus className="size-4" />
                Duplicate
              </ContextMenuItem>
              <ContextMenuItem variant="destructive" onClick={deleteNode}>
                <Trash2 className="size-4" />
                Delete
              </ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuLabel>Add new node to Canvas</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={addNoteNode}
                className="cursor-pointer w-full"
              >
                <Notebook className="size-4" />
                Note
              </ContextMenuItem>
              <DialogTrigger className="w-full">
                <ContextMenuItem
                  onClick={() => setAddNodeType("FileNode")}
                  className="cursor-pointer w-full"
                >
                  <File className="size-4" />
                  Image / Audio / Video / PDF
                </ContextMenuItem>
              </DialogTrigger>
              <ContextMenuItem
                onClick={addTODONode}
                className="cursor-pointer w-full"
              >
                <ListChecks className="size-4" />
                TODO
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {addNodeType}</DialogTitle>
          </DialogHeader>
          <FileUpload />
        </DialogContent>
      </Dialog>

      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="z-[1001]">
          <DialogHeader>
            <DialogTitle>
              {summaryStatus === "summarizing"
                ? "Summarizing…"
                : summaryStatus === "done"
                  ? "Summary"
                  : "Error"}
            </DialogTitle>
          </DialogHeader>
          {summaryStatus === "summarizing" ? (
            <p className="text-muted-foreground">
              {summaryProgress ?? "Please wait…"}
            </p>
          ) : summaryStatus === "done" ? (
            <>
              <p className="whitespace-pre-wrap text-sm">{summaryText}</p>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(summaryText);
                  toast.success("Copied summary to clipboard!");
                }}
              >
                <Copy className="size-4" />
                Copy Summary
              </Button>
            </>
          ) : summaryStatus === "error" ? (
            <p className="text-destructive text-sm">{summaryError}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CanvasContextMenu;
