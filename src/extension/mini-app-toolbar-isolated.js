import MiniAppToolbar from "@/app/MiniAppToolbar.jsx";
import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { watchTelegramMiniApp } from "./content-script-utils";

/** Initial Location */
const INITIAL_HOST = location.host;
const INITIAL_LOCATION = location.href;

function initialize() {
  /** Connect to Messaging */
  const port = chrome.runtime.connect(chrome.runtime.id, {
    name: `mini-app-toolbar:${location.host}`,
  });

  /** Create Container */
  const container = document.createElement("div");

  /** Append Root */
  document.body.appendChild(container);

  /** Render React App */
  createRoot(container).render(
    createElement(MiniAppToolbar, {
      url: INITIAL_LOCATION,
      host: INITIAL_HOST,
      port,
    })
  );
}

watchTelegramMiniApp().then(() => {
  if (document.body) {
    initialize();
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      initialize();
    });
  }
});
