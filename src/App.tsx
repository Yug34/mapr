import { Suspense, lazy } from "react";
import { LoaderCircle } from "lucide-react";
const Canvas = lazy(() => import("./components/Canvas"));
import DockWrapper from "./components/DockWrapper";

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
        <DockWrapper />
      </div>
    </div>
  );
}

export default App;
