import { Suspense, lazy } from "react";
import { LoaderCircle } from "lucide-react";
const Canvas = lazy(() => import("./components/Canvas"));
import DockWrapper from "./components/DockWrapper";
import { useCanvasStore } from "./store/canvasStore";
import { Badge } from "./components/ui/badge";

function App() {
  const { tabs, activeTabId } = useCanvasStore();

  const currentTabTitle = tabs.find((tab) => tab.id === activeTabId)?.title;

  return (
    <div className="w-screen h-screen flex flex-row overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 py-2 absolute top-0 left-0 flex w-full items-center justify-center bg-transparent">
          <Badge
            variant="secondary"
            className="bg-blue-500 text-white dark:bg-blue-600 p-2"
          >
            {currentTabTitle}
          </Badge>
        </div>

        <Suspense
          fallback={
            <div className="flex-1 min-h-0 flex items-center justify-center text-lg">
              Loading <LoaderCircle className="animate-spin ml-2" />
            </div>
          }
        >
          <Canvas />
        </Suspense>
        <DockWrapper />
      </div>
    </div>
  );
}

export default App;
