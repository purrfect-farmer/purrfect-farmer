import MiniAppToolbar from "@/app/MiniAppToolbar.jsx";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { getSettings } from "@/lib/utils";

/** Initial Location */
const INITIAL_HOST = location.host;
const INITIAL_LOCATION = location.href;

if (/tgWebAppPlatform=android/.test(location.href)) {
  /** Connect to Messaging */
  const port = chrome.runtime.connect(chrome.runtime.id, {
    name: `mini-app-toolbar:${location.host}`,
  });

  /** Initial State */
  let toolbar = null;

  /** Create Toolbar */
  const createToolbar = () => {
    /** Prevent Duplicates */
    if (toolbar) return;

    /** Create Container */
    const container = document.createElement("div");

    /** Append Root */
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      createElement(MiniAppToolbar, {
        url: INITIAL_LOCATION,
        host: INITIAL_HOST,
        port,
      })
    );

    /** Save Toolbar */
    toolbar = {
      container,
      root,
    };
  };

  /** Remove Toolbar */
  const removeToolbar = () => {
    toolbar?.root?.unmount();
    toolbar?.container?.remove();
    toolbar = null;
  };

  /** Watch Ready State */
  document.addEventListener("readystatechange", async (ev) => {
    if (document.readyState === "interactive") {
      const { showMiniAppToolbar } = await getSettings();

      /** Create Initial Toolbar */
      if (showMiniAppToolbar) {
        createToolbar();
      }

      /** Watch Storage for Settings Change */
      chrome.storage.local.onChanged.addListener(({ settings }) => {
        if (settings?.newValue) {
          const { showMiniAppToolbar } = settings.newValue;

          if (showMiniAppToolbar) {
            createToolbar();
          } else {
            removeToolbar();
          }
        }
      });
    }
  });
}
