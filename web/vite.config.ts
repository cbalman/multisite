import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://api:8000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://api:8000",
        changeOrigin: true,
      },
      "/docs": {
        target: "http://api:8000",
        changeOrigin: true,
      },
      "/openapi.json": {
        target: "http://api:8000",
        changeOrigin: true,
      },
    },
  },
});