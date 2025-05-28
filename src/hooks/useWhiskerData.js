import { sendWebviewMessage } from "@/lib/utils";
import { useEffect } from "react";

import useBackupAndRestore from "./useBackupAndRestore";
import useRefCallback from "./useRefCallback";

export default function useWhiskerData(app) {
  const { hasRestoredSettings } = app;
  const backupAndRestore = useBackupAndRestore(app);

  const getBackupData = useRefCallback(backupAndRestore[0]);
  const restoreBackupData = useRefCallback(backupAndRestore[1]);

  const configureSettings = useRefCallback(app.configureSettings);
  const updateSharedSettings = useRefCallback(app.updateSharedSettings);
  const updateActiveAccount = useRefCallback(app.updateActiveAccount);

  /** Whisker Message */
  useEffect(() => {
    if (!hasRestoredSettings) return;
    else if (import.meta.env.VITE_WHISKER) {
      /** Message Listener */
      const listener = (_event, { action, data }) => {
        /** Reply to Message */
        const reply = (data) => {
          sendWebviewMessage({
            action: `response-${action}`,
            data,
          });
        };

        switch (action) {
          /** Get Backup Data */
          case "get-backup-data":
            getBackupData().then((data) => {
              reply(data);
            });
            break;

          /** Restore Backup Data */
          case "restore-backup-data":
            const { data: backupData } = data;
            restoreBackupData(backupData).then(() => {
              reply(true);
            });
            break;

          /** Set Whisker Data */
          case "set-whisker-data":
            const { account, theme } = data;
            const {
              proxyEnabled,
              proxyHost,
              proxyPort,
              proxyUsername,
              proxyPassword,
            } = account;

            /** Expose Partition */
            window.WHISKER_PARTITION = account.partition;

            /** Update Account */
            updateActiveAccount({
              title: account.title,
            });

            /** Update Proxy */
            updateSharedSettings({
              proxyEnabled,
              proxyHost,
              proxyPort,
              proxyUsername,
              proxyPassword,
            });

            /** Configure Theme */
            configureSettings("theme", theme, false);

            break;
        }
      };

      /** Add Listener */
      window.electron.ipcRenderer.on("host-message", listener);

      /** Request for Whisker Data */
      sendWebviewMessage({
        action: "get-whisker-data",
      });

      return () =>
        window.electron.ipcRenderer.removeListener("host-message", listener);
    }
  }, [
    hasRestoredSettings,
    getBackupData,
    configureSettings,
    updateSharedSettings,
    updateActiveAccount,
    restoreBackupData,
  ]);
}
