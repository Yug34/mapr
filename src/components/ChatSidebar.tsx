import { useEffect, useRef, useState, useMemo } from "react";
import { useChatStore } from "@/store/chatStore";
import { useCanvasStore } from "@/store/canvasStore";
import type { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Send,
  SquareArrowOutUpRight,
  X,
  History,
  Plus,
  Pencil,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Loader } from "./ui/loader";
import { ThreadHistoryDialog } from "./ThreadHistoryDialog";
import { buildCanvasContext } from "@/services/canvasContextBuilder";
import { streamCanvasChat } from "@/services/canvasChatService";

function MessageBubble({
  message,
  isThinking,
}: {
  message: Message;
  isThinking?: boolean;
}) {
  const isUser = message.role === "user";
  const isSummary = message.role === "summary";
  const isEmpty = !message.content || message.content.trim() === "";

  return (
    <div
      className={cn(
        "flex w-full max-w-[400px]",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[320px] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {isSummary && message.sourceTitle && (
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Summary of {message.sourceTitle}
          </div>
        )}
        {isThinking || (isEmpty && !isUser) ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader className="ml-0" size={16} />
            <span className="text-xs italic">Thinking...</span>
          </div>
        ) : (
          <div
            className={cn(
              "prose prose-sm dark:prose-invert max-w-none",
              "prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-base prose-h2:mt-3 prose-h2:mb-2 prose-h2:border-none prose-h2:pb-0",
              "prose-p:my-1.5 prose-p:leading-relaxed",
              "prose-ul:my-0 prose-ul:px-4 prose-li:px-0 prose-ol:my-2 prose-li:my-0 prose-li:leading-relaxed",
              "prose-strong:font-semibold",
              "prose-a:underline prose-a:underline-offset-2",
              isUser
                ? "prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-li:text-primary-foreground prose-strong:text-primary-foreground prose-a:text-primary-foreground hover:prose-a:text-primary-foreground/80"
                : "prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/90"
            )}
          >
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                    <SquareArrowOutUpRight className="size-4 inline-block ml-1" />
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatSidebar() {
  const {
    threads,
    messagesByThreadId,
    activeThreadId,
    setActiveThread,
    addMessage,
    updateMessage,
    updateThreadTitle,
    closeThread,
    addThread,
    loadFromStorage,
    ensureDefaultThread,
  } = useChatStore();
  const { activeTabId } = useCanvasStore();

  const [input, setInput] = useState("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingThreadId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingThreadId]);

  useEffect(() => {
    (async () => {
      await loadFromStorage();
      await ensureDefaultThread();
    })();
  }, [loadFromStorage, ensureDefaultThread]);

  const messages = activeThreadId
    ? messagesByThreadId[activeThreadId] ?? []
    : [];

  // Only show threads that are open as tabs (isOpen !== false)
  const openThreads = useMemo(
    () => threads.filter((t) => t.isOpen !== false),
    [threads]
  );

  // Determine if we should show a thinking state
  const showThinking = useMemo(() => {
    if (messages.length === 0) return false;
    const lastMessage = messages[messages.length - 1];
    // Show thinking if last message is user (no response yet)
    if (lastMessage.role === "user") return true;
    // Show thinking if last message is assistant/summary with empty content
    if (
      (lastMessage.role === "assistant" || lastMessage.role === "summary") &&
      (!lastMessage.content || lastMessage.content.trim() === "")
    ) {
      return true;
    }
    return false;
  }, [messages]);

  // Create a dependency that changes when message content changes (for streaming updates)
  const messagesContentKey = useMemo(() => {
    return messages.map((m) => `${m.id}:${m.content.length}`).join(",");
  }, [messages]);

  // Scroll to bottom whenever messages change (including content updates during streaming)
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "auto" });
    });
  }, [messagesContentKey, messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeThreadId || sending) return;

    // First user message: set thread title to first two words
    const currentMessages = messagesByThreadId[activeThreadId] ?? [];
    const userMessages = currentMessages.filter((m) => m.role === "user");
    const isFirstUserMessage = userMessages.length === 0;
    if (isFirstUserMessage) {
      const firstTwoWords = text.trim().split(/\s+/).slice(0, 2).join(" ");
      if (firstTwoWords) {
        await updateThreadTitle(activeThreadId, firstTwoWords);
      }
    }

    await addMessage(activeThreadId, { role: "user", content: text });
    setInput("");
    setSending(true);

    let canvasContext: string;
    try {
      canvasContext = await buildCanvasContext({
        type: "tab",
        tabId: activeTabId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to build canvas context: ${msg}`);
      setSending(false);
      return;
    }

    // Ensure we have at least placeholder context so API accepts the request
    const contextToSend =
      canvasContext.trim().length > 0
        ? canvasContext
        : "## Tabs\n(none)\n\n## Nodes\n(No nodes in scope)";

    const threadMessages =
      useChatStore.getState().messagesByThreadId[activeThreadId] ?? [];
    const apiMessages = threadMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const assistantMessageId = await addMessage(activeThreadId, {
      role: "assistant",
      content: "",
    });

    let accumulatedContent = "";
    try {
      await streamCanvasChat(apiMessages, contextToSend, (chunk) => {
        accumulatedContent += chunk;
        updateMessage(assistantMessageId, accumulatedContent).catch((e) => {
          console.error("Failed to update message:", e);
        });
      });
      await updateMessage(assistantMessageId, accumulatedContent.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Chat failed: ${msg}`);
      await updateMessage(assistantMessageId, `Error: ${msg}`).catch(() => {});
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Thread tabs header */}
      <div className="flex shrink-0 items-center border-b min-w-0">
        <div
          className="flex-1 min-w-0 overflow-x-auto"
          onWheel={(e) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            e.currentTarget.scrollBy({
              left: e.deltaY,
              behavior: "smooth",
            });
          }}
        >
          <div className="flex w-max pl-2 gap-1 overflow-y-hidden">
            {openThreads.map((t) => (
              <div
                key={t.id}
                role="tab"
                aria-selected={activeThreadId === t.id}
                className={cn(
                  "group inline-flex items-center justify-center gap-1.5 shrink-0 relative rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 cursor-pointer min-w-0",
                  activeThreadId === t.id
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (
                    target.closest("svg") ||
                    target.closest("button") ||
                    target.closest("input") ||
                    target.classList.contains("close-thread-icon") ||
                    target.classList.contains("edit-thread-icon")
                  ) {
                    return;
                  }
                  setActiveThread(t.id);
                }}
              >
                {editingThreadId === t.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={async () => {
                      const trimmed = editingTitle.trim();
                      if (trimmed) await updateThreadTitle(t.id, trimmed);
                      setEditingThreadId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                      if (e.key === "Escape") {
                        setEditingTitle(t.title);
                        setEditingThreadId(null);
                        editInputRef.current?.blur();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-[60px] max-w-[140px] bg-background border rounded px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                ) : (
                  <>
                    <span className="truncate min-w-0">
                      {t.title.charAt(0).toUpperCase() + t.title.slice(1)}
                    </span>
                    {activeThreadId === t.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="edit-thread-icon shrink-0 w-3 h-3"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingThreadId(t.id);
                          setEditingTitle(t.title);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 w-3 h-3 gap-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        closeThread(t.id);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <X className="close-thread-icon size-3 z-[49] shrink-0 hover:opacity-70 transition-opacity border border-gray-300 rounded-full bg-neutral-200 hover:bg-accent" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-[40px] shrink-0 border-0 border-l-1 border-gray-300 rounded-none bg-neutral-100"
          onClick={async () => {
            const newThreadId = await addThread();
            setActiveThread(newThreadId);
          }}
        >
          <Plus className="size-4 shrink-0" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-[40px] shrink-0 border-0 border-l-1 border-gray-300 rounded-none bg-neutral-100"
          onClick={() => setHistoryDialogOpen(true)}
        >
          <History className="size-4 shrink-0" />
        </Button>
      </div>

      <ThreadHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />

      {activeThreadId ? (
        <ScrollArea className="flex-1 p-3">
          <div
            className={cn(
              "flex flex-col gap-5",
              !activeThreadId &&
                "flex flex-col h-full min-h-[300px] items-center justify-center"
            )}
          >
            <>
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground height-full flex flex-col items-center justify-center">
                  <p>No messages yet.</p>
                </div>
              )}
              {messages.map((m) => {
                const isLastMessage =
                  m.id === messages[messages.length - 1]?.id;
                const isThinkingBubble =
                  showThinking &&
                  isLastMessage &&
                  (m.role === "assistant" || m.role === "summary") &&
                  (!m.content || m.content.trim() === "");
                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isThinking={isThinkingBubble}
                  />
                );
              })}
              {showThinking &&
                messages.length > 0 &&
                messages[messages.length - 1]?.role === "user" && (
                  <MessageBubble
                    message={{
                      id: "thinking",
                      threadId: activeThreadId || "",
                      role: "assistant",
                      content: "",
                      createdAt: Date.now(),
                    }}
                    isThinking={true}
                  />
                )}
              <div ref={scrollRef} />
            </>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col text-sm text-center h-full flex items-center justify-center gap-y-4">
          <p className="text-md">Create a thread by summarizing a node.</p>
          <div>
            <Button
              variant="outline"
              className="rounded-md shadow-md"
              onClick={async () => {
                const newThreadId = await addThread();
                setActiveThread(newThreadId);
              }}
            >
              Or click here <Plus className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input + Send */}
      <div className="shrink-0 border-t p-2">
        <div className="flex gap-2">
          <textarea
            className="min-h-[80px] w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
          />
          <Button
            size="icon"
            aria-label="Send"
            onClick={handleSend}
            disabled={!input.trim() || !activeThreadId || sending}
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
