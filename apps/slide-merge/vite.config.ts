import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { GAME_ID, SDK_GLOBAL_NAME } from "./src/game-name.ts";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // library mode does not replace this and React reads it
  define: { "process.env.NODE_ENV": JSON.stringify(mode) },
  build: {
    copyPublicDir: false,
    lib: {
      entry: "src/sdk.ts",
      formats: ["iife"],
      name: SDK_GLOBAL_NAME,
      fileName: () => `${GAME_ID}-sdk.js`,
    },
  },
}));
