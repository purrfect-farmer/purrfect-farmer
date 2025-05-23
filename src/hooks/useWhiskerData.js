import { useEffect } from "react";

export default function useWhiskerData(app) {
  const { configureSettings, hasRestoredSettings, updateActiveAccount } = app;

  /** Whisker Message */
  useEffect(() => {
    if (import.meta.env.VITE_WHISKER) {
      if (!hasRestoredSettings) return;
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

      return () => window.electron.ipcRenderer.off("host-message", listener);
    }
  }, [configureSettings, hasRestoredSettings, updateActiveAccount]);
}
