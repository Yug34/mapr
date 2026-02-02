import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import type { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquarePlus, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSummary = message.role === "summary";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {isSummary && message.sourceTitle && (
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Summary of {message.sourceTitle}
          </div>
        )}
        {isSummary || message.role === "assistant" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
    addThread,
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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleNewThread = async () => {
    await addThread();
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeThreadId) return;
    await addMessage(activeThreadId, { role: "user", content: text });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Thread tabs header */}
      <div className="flex shrink-0 items-center gap-1 border-b p-2">
        <ScrollArea className="flex-1 overflow-x-auto">
          <div className="flex gap-1">
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
        </ScrollArea>
        <Button
          variant="ghost"
          size="icon"
          aria-label="New chat"
          onClick={handleNewThread}
        >
          <MessageSquarePlus className="size-4" />
        </Button>
      </div>

      {/* Message list */}
      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
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
