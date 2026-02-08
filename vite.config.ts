// Avoid Node type imports to keep config lint-clean without @types/node
import { copyFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

/** Copies sqlite3.wasm into dist/assets/ so the worker (served from /assets/) can load it. */
function copySqliteWasm() {
  let outDir = "dist";
  return {
    name: "copy-sqlite-wasm",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const destDir = join(outDir, "assets");
      const dest = join(destDir, "sqlite3.wasm");
      const src = resolve(
        "node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm"
      );
      mkdirSync(destDir, { recursive: true });
      copyFileSync(src, dest);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), copySqliteWasm()],
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
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    // Add proxy for API calls in development
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Vercel dev server
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "pdfjs-dist"],
    exclude: ["@sqlite.org/sqlite-wasm"],
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
