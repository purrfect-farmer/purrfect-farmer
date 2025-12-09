import { renderMiniAppToolbar } from "@/app/MiniAppToolbar";

/** Initial Location */
const INITIAL_HOST = location.host;
const INITIAL_LOCATION = location.href;

function displayMiniAppToolbar() {
  /** Connect to Messaging */
  const port = chrome.runtime.connect(chrome.runtime.id, {
    name: `mini-app-toolbar:${location.host}`,
  });

  /** Create Container */
  const container = document.createElement("div");

  /** Append Root */
  document.body.appendChild(container);

  /** Render React App */
  renderMiniAppToolbar({
    container,
    props: {
      url: INITIAL_LOCATION,
      host: INITIAL_HOST,
      port,
    },
  });
}

export function setupMiniAppToolbar() {
  if (document.body) {
    displayMiniAppToolbar();
  } else {
    document.addEventListener("DOMContentLoaded", () =>
      displayMiniAppToolbar()
    );
  }
}
