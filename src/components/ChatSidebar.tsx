import { useEffect, useRef, useState, useMemo } from "react";
import { useChatStore } from "@/store/chatStore";
import type { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, SquareArrowOutUpRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Loader } from "./ui/loader";

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
    loadFromStorage,
    ensureDefaultThread,
  } = useChatStore();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      await loadFromStorage();
      await ensureDefaultThread();
    })();
  }, [loadFromStorage, ensureDefaultThread]);

  const messages = activeThreadId
    ? messagesByThreadId[activeThreadId] ?? []
    : [];

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
    if (!text || !activeThreadId) return;
    await addMessage(activeThreadId, { role: "user", content: text });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Thread tabs header */}
      <div className="flex shrink-0 items-center gap-1 border-b p-2 min-w-0">
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex w-max gap-1">
            {threads.map((t) => (
              <Button
                key={t.id}
                variant={activeThreadId === t.id ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0"
                onClick={() => setActiveThread(t.id)}
              >
                {t.title}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Message list */}
      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col gap-5">
          {messages.map((m) => {
            const isLastMessage = m.id === messages[messages.length - 1]?.id;
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
        </div>
      </ScrollArea>

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
            disabled={!input.trim() || !activeThreadId}
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
