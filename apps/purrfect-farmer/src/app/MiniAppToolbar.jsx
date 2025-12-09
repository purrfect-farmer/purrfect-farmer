import AppContext from "@/contexts/AppContext";
import ToolbarPanel from "@/toolbar/ToolbarPanel";
import usePortMirror from "@/hooks/usePortMirror";
import SharedContext from "@/contexts/SharedContext";
import useSharedStorageState from "@/hooks/useSharedStorageState";
import { BrowserRouter } from "react-router";
import { setupChromeStorage } from "@/lib/chrome-storage";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/**
 * Default Shared Settings
 */
const defaultSharedSettings = {
  showMiniAppToolbar: true,
};

/**
 * Mini App Toolbar Component
 * @param {object} param0
 * @param {string} param0.host
 * @param {string} param0.url
 * @param {chrome.runtime.Port} param0.port
 * @returns
 */
export default function MiniAppToolbar({ host, url, port }) {
  const mirror = usePortMirror(port);
  const { value: sharedSettings } = useSharedStorageState(
    "settings",
    defaultSharedSettings
  );
  const { showMiniAppToolbar } = sharedSettings;

  return (
    <SharedContext.Provider value={{ mirror, sharedSettings }}>
      <AppContext.Provider value={{ port, host, url }}>
        {showMiniAppToolbar ? <ToolbarPanel /> : null}
      </AppContext.Provider>
    </SharedContext.Provider>
  );
}

/**
 * Render Mini App Toolbar
 * @param {object} param0
 * @param {HTMLElement} param0.container
 * @param {object} param0.props
 */
export function renderMiniAppToolbar({ container, props } = {}) {
  setupChromeStorage().then(() =>
    createRoot(container || document.getElementById("root")).render(
      <StrictMode>
        <BrowserRouter>
          <MiniAppToolbar {...props} />
        </BrowserRouter>
      </StrictMode>
    )
  );
}
