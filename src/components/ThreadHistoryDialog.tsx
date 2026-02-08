import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import type { Thread, Message } from "@/types/chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAll, Stores } from "@/utils/sqliteDb";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function ThreadHistoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    activeThreadId,
    setActiveThread,
    getAllThreads,
    ensureThreadVisible,
    deleteThread,
  } = useChatStore();
  const [allThreads, setAllThreads] = useState<Thread[]>([]);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    if (open) {
      loadThreads();
    }
  }, [open]);

  const loadThreads = async () => {
    const threads = await getAllThreads();
    const messages = (await getAll<Message>(Stores.chat_messages)) ?? [];
    const messagesByThreadId = messages.reduce<Record<string, Message[]>>(
      (acc, m) => {
        if (!acc[m.threadId]) acc[m.threadId] = [];
        acc[m.threadId].push(m);
        return acc;
      },
      {}
    );
    setAllThreads(threads);
    setAllMessages(messagesByThreadId);
  };

  const handleThreadClick = async (thread: Thread) => {
    // Ensure thread is visible in sidebar (will reopen if closed and update timestamp)
    // This also updates the store state directly, so no need to reload everything
    await ensureThreadVisible(thread.id);
    // Set as active thread
    await setActiveThread(thread.id);
    onOpenChange(false);
  };

  const handleDeleteThread = async (
    e: React.MouseEvent,
    threadId: string,
    threadTitle: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteThread(threadId);
      setAllThreads((prev) => prev.filter((t) => t.id !== threadId));
      setAllMessages((prev) => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
      toast.success(`Deleted "${threadTitle}"`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to delete: ${msg}`);
    }
  };

  const getMessageCount = (threadId: string): number => {
    return allMessages[threadId]?.length ?? 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Thread History</DialogTitle>
          <DialogDescription>
            View and switch between all your chat threads
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="flex flex-col gap-2">
            {allThreads.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No threads found
              </div>
            ) : (
              allThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const isClosed = thread.toShowInSidebar === false;
                const messageCount = getMessageCount(thread.id);
                const displayDate = formatDate(
                  thread.updatedAt ?? thread.createdAt
                );

                return (
                  <div
                    key={thread.id}
                    className="flex items-center gap-2 w-full rounded-md transition-colors hover:bg-accent/50"
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "flex-1 justify-start h-auto p-4 text-left min-w-0"
                      )}
                      onClick={() => handleThreadClick(thread)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {thread.title}
                          </span>
                          {isClosed && (
                            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                              Closed
                            </span>
                          )}
                          {isActive && (
                            <span className="text-xs text-primary px-2 py-0.5 rounded bg-primary/10">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{messageCount} messages</span>
                          <span>•</span>
                          <span>{displayDate}</span>
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={(e) =>
                        handleDeleteThread(e, thread.id, thread.title)
                      }
                      aria-label={`Delete ${thread.title}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
