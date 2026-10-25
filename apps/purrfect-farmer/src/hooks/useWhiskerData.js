import { sendWebviewMessage } from "@/utils";
import {
  resyncWhiskerUserAgent,
  syncWhiskerUserAgent,
} from "@/lib/userAgent";
import useBackupAndRestore from "./useBackupAndRestore";
import { useEffect } from "react";
import useMemoizedCallback from "./useMemoizedCallback";

export default function useWhiskerData(app) {
  const [backup, restore] = useBackupAndRestore(app);

  const getBackupData = useMemoizedCallback(backup);
  const restoreBackupData = useMemoizedCallback(restore);

  const updateSettings = useMemoizedCallback(app.updateSettings);
  const updateSharedSettings = useMemoizedCallback(app.updateSharedSettings);
  const updateActiveAccount = useMemoizedCallback(app.updateActiveAccount);

  /** Whisker Message */
  useEffect(() => {
    if (import.meta.env.VITE_WHISKER) {
      /** Message Listener */
      const listener = (_event, { action, data }) => {
        console.log("Received message from Whisker...", { action, data });

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
            console.log("Creating backup for Whisker...");
            getBackupData().then((data) => {
              reply(data);
            });
            break;

          /** Restore Backup Data */
          case "restore-backup-data":
            console.log("Restoring backup from Whisker...", data);
            const { data: backupData } = data;
            restoreBackupData(backupData)
              .then(() => resyncWhiskerUserAgent())
              .then(() => {
                reply(true);
              });
            break;

          /** Set Whisker Data */
          case "set-whisker-data":
            console.log("Updating app from Whisker data...", data);

            const { account, settings, sharedSettings } = data;

            /** Expose Partition */
            window.WHISKER_PARTITION = account.partition;

            /** Update Account */
            updateActiveAccount(account);

            /** Apply or adopt the User-Agent */
            syncWhiskerUserAgent(account.userAgent);

            /** Update Settings */
            updateSettings({ ...settings }, false);

            /** Update Shared Settings */
            updateSharedSettings({ ...sharedSettings }, false);

            break;
        }
      };

      /** Add Listener */
      window.electron.ipcRenderer.on("host-message", listener);

      /** Request for Whisker Data */
      console.log("Requesting for Whisker data...");
      sendWebviewMessage({
        action: "get-whisker-data",
      });

      return () =>
        window.electron.ipcRenderer.removeListener("host-message", listener);
    }
  }, [
    getBackupData,
    updateSettings,
    updateSharedSettings,
    updateActiveAccount,
    restoreBackupData,
  ]);
}
