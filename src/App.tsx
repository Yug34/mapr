import { Suspense, lazy, useEffect } from "react";
const Canvas = lazy(() => import("./components/Canvas"));
import DockWrapper from "./components/Dock";
import { useCanvas } from "./hooks/useCanvas";
import { Badge } from "./components/ui/badge";
import { Loader } from "./components/ui/loader";
import { Walkthrough } from "./components/Walkthrough";
import { QueryDevPanel } from "./components/QueryDevPanel";
import { getAll, Stores } from "./utils/sqliteDb";

function App() {
  const { tabs, activeTabId, initialized } = useCanvas();

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
    <div className="w-screen h-screen flex flex-row overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        {initialized && (
          <div className="z-999 px-4 py-2 absolute top-0 left-0 flex w-full items-center justify-center bg-transparent">
            <Badge
              variant="secondary"
              className="bg-blue-500 text-white dark:bg-blue-600 p-2"
            >
              {currentTabTitle}
            </Badge>
          </div>
        )}

        <Suspense
          fallback={
            <div className="flex-1 min-h-0 flex items-center justify-center text-lg">
              Initializing
              <Loader />
            </div>
          }
        >
          <Canvas />
        </Suspense>
        <DockWrapper />
        <Walkthrough />
        <QueryDevPanel />
      </div>
    </div>
  );
}

export default App;
