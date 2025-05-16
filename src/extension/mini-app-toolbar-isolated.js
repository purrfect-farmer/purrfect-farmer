import MiniAppToolbar from "@/app/MiniAppToolbar.jsx";
import { createElement } from "react";
import { createRoot } from "react-dom/client";

/** Initial Location */
const INITIAL_HOST = location.host;
const INITIAL_LOCATION = location.href;

if (/tgWebAppPlatform=android/.test(location.href)) {
  /** Connect to Messaging */
  const port = chrome.runtime.connect(chrome.runtime.id, {
    name: `mini-app-toolbar:${location.host}`,
  });

  /** Link fonts stylesheet */
  const fonts = chrome.runtime.getURL("fonts.css");
  const link = document.createElement("link");

  link.href = fonts;
  link.rel = "stylesheet";
  link.type = "text/css";

  /** Append to head */
  document.head.appendChild(link);

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
