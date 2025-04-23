import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Chrome Manifest
 * @returns {import("vite").Plugin}
 */
export default function generateChromeManifest(env) {
  const isPWA = typeof process.env.VITE_PWA !== "undefined";
  const isBridge = typeof process.env.VITE_BRIDGE !== "undefined";
  const isIndex = process.env.VITE_ENTRY === "index";
  const isServiceWorker = process.env.VITE_ENTRY === "chrome-service-worker";
  const canApply =
    (isPWA === false && isIndex) || (isBridge && isServiceWorker);

  return {
    name: "generate-chrome-manifest",
    async generateBundle() {
      const pkg = JSON.parse(
        await fs.readFile(path.join(__dirname, "package.json"), "utf8")
      );
      const json = JSON.stringify(
        {
          manifest_version: 3,
          name: env.VITE_APP_NAME + (isBridge ? " Bridge" : ""),
          description: (isBridge ? "(Bridge) " : "") + env.VITE_APP_DESCRIPTION,
          version: pkg.version,
          icons: {
            16: "icon-16.png",
            32: "icon-32.png",
            48: "icon-48.png",
            128: "icon-128.png",
          },
          permissions: [
            "tabs",
            "cookies",
            "windows",
            "activeTab",
            "storage",
            "unlimitedStorage",
            "sidePanel",
            "notifications",
            "webRequest",
            "webNavigation",
            "declarativeNetRequest",
            "system.display",
          ],
          action:
            isBridge === false
              ? {
                  default_icon: "icon-48.png",
                  default_title: "Open Purrfect Farmer",
                  default_popup: "index.html",
                }
              : undefined,
          side_panel:
            isBridge === false
              ? {
                  default_path: "index.html",
                }
              : undefined,
          background: {
            service_worker: "chrome-service-worker.js",
            type: "module",
          },
          host_permissions: ["*://*/*", "wss://*/*"],
          externally_connectable: {
            matches: [
              "*://purrfectfarmer.com/*",
              "*://purrfect-farmer.github.io/*",
              "*://localhost/*",
            ],
          },
          content_scripts: [
            {
              matches: ["*://*/*"],
              js: ["content-script-main.js"],
              run_at: "document_start",
              world: "MAIN",
              all_frames: true,
            },
            {
              matches: ["*://*/*"],
              js: ["content-script-isolated.js"],
              run_at: "document_start",
              world: "ISOLATED",
              all_frames: true,
            },
            {
              matches: ["*://*/*"],
              js: ["content-script-patches.js"],
              run_at: "document_start",
              world: "MAIN",
              all_frames: true,
            },
            {
              matches: ["*://*/*"],
              js: ["mini-app-toolbar-isolated.js"],
              run_at: "document_start",
              world: "ISOLATED",
              all_frames: true,
            },
            {
              matches: ["*://notgramgame.fun/*"],
              js: ["notgram-main.js"],
              run_at: "document_start",
              world: "MAIN",
              all_frames: true,
            },
            {
              matches: ["*://web.telegram.org/*"],
              js: ["telegram-web-main.js"],
              run_at: "document_start",
              world: "MAIN",
              all_frames: true,
            },
            {
              matches: ["*://web.telegram.org/*"],
              js: ["telegram-web-isolated.js"],
              run_at: "document_start",
              world: "ISOLATED",
              all_frames: true,
            },
          ],

          declarative_net_request: {
            rule_resources: [],
          },
          content_security_policy: {
            extension_pages:
              "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
            sandbox:
              "sandbox allow-scripts allow-forms allow-popups allow-modals;",
          },
          sandbox: {
            pages: [],
          },
        },
        null,
        "\t"
      );

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: json,
      });
    },
    apply(config, { command }) {
      return command === "build" && canApply;
    },
  };
}
