import { ViteEjsPlugin } from "vite-plugin-ejs";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { generateChromeManifest } from "./plugins/generate-chrome-manifest.js";
import { imagetools } from "vite-imagetools";
import { loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import pkg from "./package.json" with { type: "json" };
import { transformCssBundle } from "./plugins/transform-css-bundle.js";

const __dirname = import.meta.dirname;

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  /** Env */
  const env = loadEnv(mode, process.cwd());

  const isIndexEntry =
    !process.env.VITE_ENTRY || process.env.VITE_ENTRY === "index";
  const isPWA = Boolean(process.env.VITE_PWA);
  const isBridge = Boolean(process.env.VITE_BRIDGE);
  const isWhisker = Boolean(process.env.VITE_WHISKER);
  const isStylesEntry = process.env.VITE_ENTRY?.endsWith("styles");

  const outDir = isWhisker
    ? "dist-whisker"
    : isBridge
      ? "dist-bridge"
      : process.env.VITE_EXTENSION
        ? "dist-extension"
        : "dist";

  let input, output;

  if (isIndexEntry) {
    /** Index HTML */
    const indexHtml = isBridge
      ? path.resolve(__dirname, "./pwa-iframe.html")
      : path.resolve(__dirname, "./index.html");

    /** Browser Sandbox HTML */
    const browserSandboxHtml = path.resolve(
      __dirname,
      "./browser-sandbox.html",
    );

    /** Input */
    input = [indexHtml, browserSandboxHtml];
  } else if (isStylesEntry) {
    input = path.resolve(
      __dirname,
      `./src/extension/${process.env.VITE_ENTRY}.css`,
    );
  } else {
    input = path.resolve(
      __dirname,
      `./src/extension/${process.env.VITE_ENTRY}.js`,
    );
  }

  if (isIndexEntry) {
    output = {
      strictExecutionOrder: true,
      codeSplitting: {
        groups: [
          { name: "vendor-react", test: /node_modules[\\/].*react/ },
          { name: "vendor-axios", test: /node_modules[\\/].*axios/ },
          { name: "vendor-ton", test: /node_modules[\\/].*@ton[\\/]/ },
        ],
      },
    };
  } else if (isStylesEntry) {
    output = {
      assetFileNames: (assetInfo) => {
        if (assetInfo.name?.endsWith(".css")) {
          return "extension/[name][extname]";
        }

        return "assets/[name]-[hash][extname]";
      },
    };
  } else {
    output = {
      entryFileNames: "extension/[name].js",
      format: "iife",
    };
  }

  return {
    base: isPWA ? process.env.BASE_URL : "/",
    define: {
      __APP_PACKAGE_NAME__: JSON.stringify(pkg.name),
      __APP_PACKAGE_VERSION__: JSON.stringify(pkg.version),
      __ENCRYPTION_KEY__: JSON.stringify(
        new Date().toISOString().split("T")[0],
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "~@fontsource": "@fontsource",
      },
    },
    build: {
      outDir,
      modulePreload: false,
      emptyOutDir: isIndexEntry,
      rolldownOptions: {
        input,
        output,
      },
    },
    plugins: [
      /** Plugins */
      generateChromeManifest(env, pkg, {
        enabled: !isPWA && isIndexEntry,
        isBridge,
        isWhisker,
      }),
      transformCssBundle({
        enable: isStylesEntry,
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
        disable: !isPWA,
      }),
      /** Plugins */
      nodePolyfills({
        exclude: ["vm"],
        globals: {
          Buffer: false,
        },
      }),
      ViteEjsPlugin(env),
      react(),
      tailwindcss(),
      imagetools(),
    ],
  };
});
