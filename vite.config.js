import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { imagetools } from "vite-imagetools";
import { loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

import generateChromeManifest from "./generateChromeManifest";

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
        [
          /** Entries */
          "index",
        ].map((item) => [item, path.resolve(__dirname, `./${item}.html`)])
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
      outDir: process.env.VITE_BRIDGE ? "dist-bridge" : "dist",
      emptyOutDir: process.env.VITE_ENTRY === "index",
      rollupOptions: {
        input,
        output:
          process.env.VITE_ENTRY !== "index"
            ? {
                entryFileNames: "[name].js",
                format: "iife",
              }
            : undefined,
      },
    },
    plugins: [
      /** Plugins */
      generateChromeManifest(env),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.*"],
          maximumFileSizeToCacheInBytes: 5 * 1024 ** 2,
        },
        manifest: {
          name: env.VITE_APP_NAME,
          short_name: env.VITE_APP_NAME,
          description: env.VITE_APP_DESCRIPTION,
          theme_color: "#ffffff",
          icons: [
            {
              src: "pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }).map((plugin) => ({
        ...plugin,
        apply(config, { command }) {
          return (
            command === "build" && typeof process.env.VITE_PWA !== "undefined"
          );
        },
      })),
      /** Plugins */
      nodePolyfills({
        globals: {
          Buffer: false,
        },
      }),
      ViteEjsPlugin(env),
      react(),
      tailwindcss(),
      imagetools(),
    ],
    esbuild: {
      supported: {
        "top-level-await": true,
      },
    },
  };
});
