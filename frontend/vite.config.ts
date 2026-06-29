import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const fileEnvironment = loadEnv(mode, process.cwd(), "");
  const apiKey = process.env.API_KEY ?? fileEnvironment.API_KEY;
  const backendOrigin =
    process.env.BACKEND_ORIGIN ??
    fileEnvironment.BACKEND_ORIGIN ??
    "http://localhost:8000";

  if (command === "serve" && !apiKey) {
    throw new Error(
      "API_KEY is required by the Vite development proxy and must not be bundled into browser code.",
    );
  }

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: backendOrigin,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          headers: {
            "X-API-Key": apiKey ?? "",
          },
        },
      },
    },
  };
});
