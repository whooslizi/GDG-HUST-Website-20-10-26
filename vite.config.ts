import { defineConfig, loadEnv } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// Unique per build; written to version.json so open tabs can detect a new deploy (src/version-check.ts).
const BUILD_ID = String(Date.now());

// Shell/CI variables win; .env fills the gaps for local dev.
const env = { ...loadEnv(process.env.NODE_ENV === "production" ? "production" : "development", process.cwd(), ""), ...process.env };

export default defineConfig(({ command }) => ({
  base: env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? "/GDG-HUST-Website-20-10-26/" : "/"),
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    // Local-only test login (npm run dev); always empty in builds, so it can't become a backdoor.
    __DEMO_GIRL_CODE__: JSON.stringify(command === "serve" ? env.DEMO_GIRL_CODE || "" : ""),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.URL || ""
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.KEY || env.ANON_KEY || ""
    ),
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
    tailwindcss(),
    {
      name: "version-json",
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ id: BUILD_ID }) });
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  preview: {
    host: "0.0.0.0",
    port: 8080,
  },
}));
