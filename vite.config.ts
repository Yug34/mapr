import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
});
