import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { imagetools } from "vite-imagetools";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(() => {
  let input;

  switch (process.env.VITE_ENTRY) {
    case "index":
      input = Object.fromEntries(
        ["index", "notpixel-sandbox"].map((item) => [
          item,
          path.resolve(__dirname, `./${item}.html`),
        ])
      );
      break;
    default:
      input = {
        [process.env.VITE_ENTRY]: path.resolve(
          __dirname,
          `./src/${process.env.VITE_ENTRY}.js`
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
        output: {
          entryFileNames: "[name].js",
        },
      },
    },
    plugins: [react(), imagetools()],
    esbuild: {
      supported: {
        "top-level-await": true,
      },
    },
  };
});
