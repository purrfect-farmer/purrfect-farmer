import { useEffect } from "react";

import useRefCallback from "./useRefCallback";

export default function useWhiskerData(app) {
  const { hasRestoredSettings } = app;
  const configureSettings = useRefCallback(app.configureSettings);
  const updateActiveAccount = useRefCallback(app.updateActiveAccount);

  /** Whisker Message */
  useEffect(() => {
    if (import.meta.env.VITE_WHISKER) {
      if (!hasRestoredSettings) return;
      else {
        /** Message Listener */
        const listener = (_event, { action, data }) => {
          if (action === "set-whisker-data") {
            const { account, theme } = data;

            /** Update Account */
            updateActiveAccount({
              title: account.title,
            });

            /** Configure Theme */
            configureSettings("theme", theme, false);
          }
        };

        /** Add Listener */
        window.electron.ipcRenderer.on("host-message", listener);

        /** Request for Whisker Data */
        window.electron.ipcRenderer.sendToHost("webview-message", {
          action: "get-whisker-data",
        });

        return () =>
          window.electron.ipcRenderer.removeListener("host-message", listener);
      }
    }
  }, [hasRestoredSettings, configureSettings, updateActiveAccount]);
}
