/**
 * Transform CSS bundle for Chrome Extension.
 * @returns {import("vite").Plugin}
 */
export function transformCssBundle({ enable = true } = {}) {
  return {
    name: "transform-css-bundle",
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === "asset" && file.fileName.endsWith(".css")) {
          const original = file.source;

          file.source = original.replace(
            /url\(([^\)]+)\)/g,
            "url(chrome-extension://__MSG_@@extension_id__$1)"
          );
        }
      }
    },
    apply: (config, { command }) => {
      return command === "build" && enable;
    },
  };
}
