import AppContext from "@/contexts/AppContext";
import ToolbarPanel from "@/toolbar/ToolbarPanel";
import usePortMirror from "@/hooks/usePortMirror";
import SharedContext from "@/contexts/SharedContext";
import useSharedStorageState from "@/hooks/useSharedStorageState";
import { BrowserRouter } from "react-router";
import { setupChromeStorage } from "@/lib/chrome-storage";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const defaultSharedSettings = {
  showMiniAppToolbar: true,
};

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
