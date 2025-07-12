import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import topLevelAwait from "vite-plugin-top-level-await";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { imagetools } from "vite-imagetools";
import { loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { viteStaticCopy } from "vite-plugin-static-copy";

import { generateChromeManifest } from "./plugins/generate-chrome-manifest";
import { getPackageJson } from "./scripts/get-package-json";
import { transformCssBundle } from "./plugins/transform-css-bundle";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMOJI_STATIC_ASSETS = [
  {
    src: "node_modules/emoji-data-ios/img-apple-64",
    dest: ".",
  },
  {
    src: "node_modules/emoji-data-ios/img-apple-160",
    dest: ".",
  },
];

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  /** Pkg */
  const pkg = getPackageJson();

  /** Env */
  const env = loadEnv(mode, process.cwd());

  return {
    base: Boolean(process.env.VITE_PWA) ? process.env.BASE_URL : "/",
    define: {
      APP_VERSION: JSON.stringify("10.9.55"),
      APP_REVISION: JSON.stringify("master"),
      __APP_PACKAGE_NAME__: JSON.stringify(pkg.name),
      __APP_PACKAGE_VERSION__: JSON.stringify(pkg.version),
      __ENCRYPTION_KEY__: JSON.stringify(
        new Date().toISOString().split("T")[0]
      ),
    },
    resolve: {
      alias: {
        "@teact": path.resolve(__dirname, "src/telegram-web/lib/teact"),
        "~@fontsource": "@fontsource",
        "@": path.resolve(__dirname, "./src"),
      },
    },
    css: {
      modules: {
        localsConvention: "camelCaseOnly",
        generateScopedName: "[name]__[local]",
      },
    },
    build: {
      outDir: process.env.VITE_WHISKER
        ? "dist-whisker"
        : process.env.VITE_BRIDGE
        ? "dist-bridge"
        : process.env.VITE_EXTENSION
        ? "dist-extension"
        : "dist",
      emptyOutDir: process.env.VITE_ENTRY === "index",
      rollupOptions: {
        input:
          process.env.VITE_ENTRY === "index"
            ? Object.fromEntries(
                [
                  /** Entries */
                  "index",
                  "browser-sandbox",
                ].map((item) => [
                  item,
                  path.resolve(
                    __dirname,
                    `./${
                      item === "index" && process.env.VITE_BRIDGE
                        ? "pwa-iframe"
                        : item
                    }.html`
                  ),
                ])
              )
            : process.env.VITE_ENTRY?.endsWith("styles")
            ? path.resolve(
                __dirname,
                `./src/extension/${process.env.VITE_ENTRY}.css`
              )
            : path.resolve(
                __dirname,
                `./src/extension/${process.env.VITE_ENTRY}.js`
              ),
        output:
          process.env.VITE_ENTRY === "index"
            ? {
                manualChunks(id) {
                  if (id.includes("node_modules")) {
                    const lib = [
                      "react",
                      "node-forge",
                      "crypto-js",
                      "axios",
                    ].find((item) => id.includes(item));

                    if (lib) {
                      return `vendor-${lib}`;
                    }
                  }
                },
              }
            : process.env.VITE_ENTRY?.endsWith("styles")
            ? {
                assetFileNames: (assetInfo) => {
                  if (assetInfo.name.endsWith(".css")) {
                    return "extension/[name][extname]";
                  }

                  return "assets/[name]-[hash][extname]";
                },
              }
            : {
                entryFileNames: "extension/[name].js",
                format: "iife",
              },
      },
    },
    plugins: [
      /** Plugins */
      generateChromeManifest(env, pkg),
      transformCssBundle({
        enable: process.env.VITE_ENTRY?.endsWith("styles"),
      }),
      viteStaticCopy({
        targets: [
          {
            src: "src/telegram-web/lib/rlottie/rlottie-wasm.wasm",
            dest: "assets",
          },
          {
            src: "node_modules/opus-recorder/dist/decoderWorker.min.wasm",
            dest: "assets",
          },
        ],
      }),
      VitePWA({
        registerType: "prompt",
        workbox: {
          globPatterns: ["**/*"],
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
        disable: true || typeof process.env.VITE_PWA === "undefined",
      }),
      /** Plugins */
      nodePolyfills({
        globals: {
          Buffer: false,
        },
      }),
      ViteEjsPlugin(env),
      react({
        jsxImportSource: "@teact",
        include: /src\/.*\.jsx?$/,
      }),
      tailwindcss(),
      imagetools(),
      topLevelAwait(),
    ],
    assetsInclude: [
      "**/*.tgs",
      "**/*.wasm",
      "**/*.woff",
      "**/*.woff2",
      "**/*.eot",
      "**/*.ttf",
      "**/*.svg",
      "**/*.txt",
      "**/*.tl",
      "**/*.strings",
    ],
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
  };
});
