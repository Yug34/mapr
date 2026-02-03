import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "./ChatSidebar";
import { QueryDevPanel } from "./QueryDevPanel";

type SidebarMode = "chat" | "query-dev";

export function SidebarContent() {
  const [mode, setMode] = useState<SidebarMode>("chat");

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* Tab header */}
      <div className="flex shrink-0 items-center gap-1 border-b p-2">
        <Button
          variant={mode === "chat" ? "secondary" : "ghost"}
          size="sm"
          className="shrink-0"
          onClick={() => setMode("chat")}
        >
          Chat
        </Button>
        <Button
          variant={mode === "query-dev" ? "secondary" : "ghost"}
          size="sm"
          className="shrink-0"
          onClick={() => setMode("query-dev")}
        >
          Query Dev
        </Button>
      </div>

      {/* Content area */}
      <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
        {mode === "chat" ? <ChatSidebar /> : <QueryDevPanel />}
      </div>
    </div>
  );
}
