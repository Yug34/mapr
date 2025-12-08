import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ReactFlowProvider } from "@xyflow/react";
import { registerServiceWorker } from "./utils/serviceWorker";
const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster }))
);

registerServiceWorker().catch((error) => {
  console.error("Failed to register service worker:", error);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReactFlowProvider>
      <App />
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </ReactFlowProvider>
  </StrictMode>
);
