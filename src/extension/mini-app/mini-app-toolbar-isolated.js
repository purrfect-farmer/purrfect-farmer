import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { setupChromeStorage } from "@/lib/chrome-storage";
import MiniAppToolbar from "@/app/MiniAppToolbar.jsx";

/** Initial Location */
const INITIAL_HOST = location.host;
const INITIAL_LOCATION = location.href;

function renderMiniAppToolbar(port) {
  /** Create Container */
  const container = document.createElement("div");

  /** Append Root */
  document.body.appendChild(container);

  /** Render React App */
  setupChromeStorage().then(() =>
    createRoot(container).render(
      createElement(MiniAppToolbar, {
        url: INITIAL_LOCATION,
        host: INITIAL_HOST,
        port,
      })
    )
  );
}

export function setupMiniAppToolbar(port) {
  if (document.body) {
    renderMiniAppToolbar(port);
  } else {
    document.addEventListener("DOMContentLoaded", () =>
      renderMiniAppToolbar(port)
    );
  }
}
