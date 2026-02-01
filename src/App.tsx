import { Suspense, lazy, useEffect } from "react";
const Canvas = lazy(() => import("./components/Canvas"));
import DockWrapper from "./components/Dock";
import { useCanvas } from "./hooks/useCanvas";
import { Badge } from "./components/ui/badge";
import { Loader } from "./components/ui/loader";
import { Walkthrough } from "./components/Walkthrough";
import { QueryDevPanel } from "./components/QueryDevPanel";
import { getAll, Stores } from "./utils/sqliteDb";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { ChatSidebar } from "./components/ChatSidebar";
import { PanelLeftClose } from "lucide-react";
import { useChatStore } from "./store/chatStore";

function App() {
  const { tabs, activeTabId, initialized } = useCanvas();
  const loadFromStorage = useChatStore((s) => s.loadFromStorage);
  const ensureDefaultThread = useChatStore((s) => s.ensureDefaultThread);

  useEffect(() => {
    loadFromStorage();
    ensureDefaultThread();
  }, [loadFromStorage, ensureDefaultThread]);

  useEffect(() => {
    async function logDbContents() {
      try {
        const [nodes, edges, media, meta, tabsData] = await Promise.all([
          getAll(Stores.nodes),
          getAll(Stores.edges),
          getAll(Stores.media),
          getAll(Stores.meta),
          getAll(Stores.tabs),
        ]);

        console.log("=== SQLite DB Contents ===");
        console.log("Nodes:", nodes);
        console.log("Edges:", edges);
        console.log("Media:", media);
        console.log("Meta:", meta);
        console.log("Tabs:", tabsData);
        console.log("========================");
      } catch (error) {
        console.error("Error reading SQLite DB:", error);
      }
    }

    logDbContents();
  }, []);

  const currentTabTitle = tabs.find((tab) => tab.id === activeTabId)?.title;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-screen flex-row overflow-hidden">
        <Sidebar>
          <ChatSidebar />
        </Sidebar>
        <SidebarInset className="flex-1 min-w-0 overflow-hidden">
          <div className="flex h-full flex-col min-h-0 w-full">
          {initialized && (
            <div className="px-4 py-2 absolute top-0 left-0 flex w-full items-center justify-center bg-transparent pointer-events-none">
              <Badge
                variant="secondary"
                className="z-[1001] bg-blue-500 text-white dark:bg-blue-600 p-2"
              >
                {currentTabTitle}
              </Badge>
            </div>
          )}
          <div className="absolute top-2 left-2 z-[1002] pointer-events-auto">
            <SidebarTrigger
              className="inline-flex size-9 items-center justify-center rounded-md border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
              aria-label="Open chat sidebar"
            >
              <PanelLeftClose className="size-4" />
            </SidebarTrigger>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center text-lg">
                  Initializing
                  <Loader />
                </div>
              }
            >
              <Canvas />
            </Suspense>
          </div>
          <DockWrapper />
          <Walkthrough />
          <QueryDevPanel />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default App;
