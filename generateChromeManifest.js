import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Chrome Manifest
 * @returns {import("vite").Plugin}
 */
export default function generateChromeManifest(env, pkg) {
  const isPWA = typeof process.env.VITE_PWA !== "undefined";
  const isBridge = typeof process.env.VITE_BRIDGE !== "undefined";
  const isIndex = process.env.VITE_ENTRY === "index";
  const canApply = isPWA === false && isIndex;

  return {
    name: "generate-chrome-manifest",
    async generateBundle() {
      const namePrefix = isBridge ? "(Bridge) " : "";
      const manifestJson = JSON.stringify(
        {
          manifest_version: 3,
          name: namePrefix + env.VITE_APP_NAME,
          description: namePrefix + env.VITE_APP_DESCRIPTION,
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
          action: {
            default_icon: "icon-48.png",
            default_title: namePrefix + "Open Purrfect Farmer",
            default_popup: isBridge ? "pwa-iframe.html" : "index.html",
          },
          side_panel: {
            default_path: isBridge ? "pwa-iframe.html" : "index.html",
          },
          background: {
            service_worker: "chrome-service-worker.js",
            type: "module",
          },
          host_permissions: ["*://*/*", "wss://*/*"],
          externally_connectable: isBridge
            ? {
                matches: [
                  `*://${new URL(env.VITE_APP_PWA_URL).hostname}/*`,
                  "*://localhost/*",
                ],
              }
            : undefined,
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
            rule_resources: [
              {
                id: "core",
                enabled: true,
                path: "rule_resources/core.json",
              },
            ],
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
        2
      );
      const resourceJson = JSON.stringify(
        [
          {
            id: 1,
            priority: 1,
            action: {
              type: "modifyHeaders",
              requestHeaders: [
                {
                  header: "sec-ch-ua",
                  operation: "set",
                  value:
                    '"Android WebView";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                },
                {
                  header: "sec-ch-ua-mobile",
                  operation: "set",
                  value: "?0",
                },
                {
                  header: "sec-ch-ua-platform",
                  operation: "set",
                  value: '"Android"',
                },
                {
                  header: "sec-ch-ua-arch",
                  operation: "set",
                  value: '""',
                },
                {
                  header: "sec-ch-ua-arch-full-version",
                  operation: "set",
                  value: '""',
                },
                {
                  header: "sec-ch-ua-platform-version",
                  operation: "set",
                  value: '""',
                },
                {
                  header: "sec-ch-ua-full-version-list",
                  operation: "set",
                  value: "",
                },
                {
                  header: "sec-ch-ua-bitness",
                  operation: "set",
                  value: '""',
                },
                {
                  header: "sec-ch-ua-model",
                  operation: "set",
                  value: '""',
                },
              ],
              responseHeaders: [
                {
                  header: "content-security-policy",
                  operation: "remove",
                },
                {
                  header: "x-frame-options",
                  operation: "remove",
                },
              ],
            },
            condition: {
              urlFilter: "*",
            },
          },
          {
            id: 2,
            action: {
              type: "modifyHeaders",
              responseHeaders: [
                {
                  header: "access-control-allow-origin",
                  operation: "set",
                  value: "*",
                },
                {
                  header: "access-control-allow-methods",
                  operation: "set",
                  value: "*",
                },
              ],
            },
            condition: {
              requestDomains: ["web.telegram.org"],
            },
          },
        ],
        null,
        2
      );

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: manifestJson,
      });

      this.emitFile({
        type: "asset",
        fileName: "rule_resources/core.json",
        source: resourceJson,
      });
    },
    apply(config, { command }) {
      return command === "build" && canApply;
    },
  };
}
