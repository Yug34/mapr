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
                  <Button
                    key={thread.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-4 text-left",
                      isActive && "bg-secondary"
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
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
