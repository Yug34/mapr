import "@xyflow/react/dist/style.css";
import { Plus } from "lucide-react";
import Canvas from "./components/Canvas";

function App() {
  return (
    <div className="w-screen h-screen flex flex-row overflow-hidden">
      <div className="w-[200px] h-full bg-red-500 flex-shrink-0">Panel</div>
      <div className="flex flex-col flex-1 min-h-0">
        <Canvas />
        <div className="flex flex-row w-full h-8 bg-blue-500 flex-shrink-0">
          <div className="">Tab 1</div>
          <div className="">Tab 1</div>
          <div className="">
            <Plus />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
