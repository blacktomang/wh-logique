import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The backend does not currently configure CORS, so all API traffic flows
// through a same-origin proxy instead of being called cross-origin from the
// browser. `VITE_API_URL` defaults to `/api`, which the dev server forwards to
// the backend below; production nginx proxies the same path to `backend:8080`.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: process.env.BACKEND_PROXY_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
