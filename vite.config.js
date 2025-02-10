import path from "path";
import react from "@vitejs/plugin-react";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { imagetools } from "vite-imagetools";
import { loadEnv } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  /** Env */
  const env = loadEnv(mode, process.cwd());

  let input;

  switch (process.env.VITE_ENTRY) {
    case "index":
      input = Object.fromEntries(
        ["index", "cloud"].map((item) => [
          item,
          path.resolve(__dirname, `./${item}.html`),
        ])
      );
      break;
    default:
      input = {
        [process.env.VITE_ENTRY]: path.resolve(
          __dirname,
          `./src/extension/${process.env.VITE_ENTRY}.js`
        ),
      };
      break;
  }

  return {
    define: {
      __ENCRYPTION_KEY__: `"${new Date().toISOString().split("T")[0]}"`,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "~@fontsource": "@fontsource",
      },
    },
    build: {
      emptyOutDir: process.env.VITE_ENTRY === "index",
      rollupOptions: {
        input,
        output: Object.assign(
          {
            entryFileNames: "[name].js",
          },
          process.env.VITE_ENTRY !== "index" ? { format: "iife" } : null
        ),
      },
    },
    plugins: [ViteEjsPlugin(env), react(), imagetools()],
    esbuild: {
      supported: {
        "top-level-await": true,
      },
    },
  };
});
