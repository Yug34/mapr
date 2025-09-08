import { Suspense, lazy } from "react";
import { Plus, LoaderCircle } from "lucide-react";
const Canvas = lazy(() => import("./components/Canvas"));
import { Button } from "./components/ui/button";

// TODO:
// 1. Add new components: TODO List
// Canvas interactions: cut copy paste etc

function App() {
  return (
    <div className="w-screen h-screen flex flex-row overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        <Suspense
          fallback={
            <div className="flex-1 min-h-0 flex items-center justify-center text-lg">
              Loading <LoaderCircle className="animate-spin ml-2" />
            </div>
          }
        >
          <Canvas />
        </Suspense>
        <div className="flex flex-row w-full h-8 bg-blue-500 flex-shrink-0">
          <div className="">Tab 1</div>
          <div className="">Tab 1</div>
          <Button>
            <Plus />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
