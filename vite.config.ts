// Avoid Node type imports to keep config lint-clean without @types/node
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Vite supports absolute from project root
      "@": "/src",
    },
  },
  server: {
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true, // wsl needs this to work
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          xyflow: ["@xyflow/react"],
          radix: [
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
          ],
          ui: ["lucide-react", "sonner"],
        },
      },
    },
    chunkSizeWarningLimit: 1024,
  },
});
