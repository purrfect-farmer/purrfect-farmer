import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Chrome Manifest
 * @returns {import("vite").Plugin}
 */
export function generateChromeManifest(env, pkg) {
  const isPWA = typeof process.env.VITE_PWA !== "undefined";
  const isBridge = typeof process.env.VITE_BRIDGE !== "undefined";
  const isWhisker = typeof process.env.VITE_WHISKER !== "undefined";
  const isIndex = process.env.VITE_ENTRY === "index";
  const enabled = isPWA === false && isIndex;

  return {
    name: "generate-chrome-manifest",
    async generateBundle() {
      const namePrefix = isWhisker ? "(Whisker) " : isBridge ? "(Bridge) " : "";
      const matches = [
        `*://${new URL(env.VITE_PWA_URL).hostname}/*`,
        "*://localhost/*",
      ];

      const manifest = {
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
          "activeTab",
          "storage",
          "unlimitedStorage",
          "webRequest",
        ].concat(
          !isWhisker
            ? [
                "proxy",
                "cookies",
                "windows",
                "sidePanel",
                "notifications",
                "webNavigation",
                "webRequestAuthProvider",
                "declarativeNetRequest",
                "system.display",
              ]
            : []
        ),
        ...(!isWhisker
          ? {
              background: {
                service_worker: "extension/chrome-service-worker.js",
                type: "module",
              },
              action: {
                default_icon: "icon-48.png",
                default_title: namePrefix + `Open ${env.VITE_APP_NAME}`,
                default_popup: isBridge ? "pwa-iframe.html" : "index.html",
              },
              side_panel: {
                default_path: isBridge ? "pwa-iframe.html" : "index.html",
              },
            }
          : {}),

        host_permissions: ["*://*/*", "ws://*/*", "wss://*/*"],
        web_accessible_resources: [
          {
            resources: [
              "assets/*.woff",
              "assets/*.woff2",
              "browser-sandbox.html",
            ],
            matches: ["*://*/*"],
          },
        ],
        externally_connectable: isBridge ? { matches } : undefined,
        content_scripts: [
          {
            matches: ["*://*/*"],
            js: ["extension/content-script-isolated.js"],
            css: ["extension/content-script-styles.css"],
            run_at: "document_start",
            world: "ISOLATED",
            all_frames: true,
          },
          {
            matches: ["*://*/*"],
            js: ["extension/content-script-main.js"],
            run_at: "document_start",
            world: "MAIN",
            all_frames: true,
          },
        ],

        content_security_policy: {
          extension_pages:
            "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
          sandbox:
            "sandbox allow-scripts allow-forms allow-popups allow-modals;",
        },
        sandbox: {
          pages: [],
        },
      };

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
    apply(config, { command }) {
      return command === "build" && enabled;
    },
  };
}
