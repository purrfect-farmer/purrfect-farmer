import { useEffect } from "react";
import { useMemo } from "react";

import useBackupAndRestore from "./useBackupAndRestore";
import useCloudSubscriptionQuery from "./useCloudSubscriptionQuery";
import useRefCallback from "./useRefCallback";

/** Send Webview Message */
const sendWebviewMessage = (data) =>
  window.electron.ipcRenderer.sendToHost("webview-message", data);

export default function useWhiskerData(app) {
  const { account, settings, hasRestoredSettings } = app;
  const { shareCloudProxy } = settings;
  const backupAndRestore = useBackupAndRestore(app);

  const getBackupData = useRefCallback(backupAndRestore[0]);
  const restoreBackupData = useRefCallback(backupAndRestore[1]);

  const configureSettings = useRefCallback(app.configureSettings);
  const updateActiveAccount = useRefCallback(app.updateActiveAccount);

  const subscriptionQuery = useCloudSubscriptionQuery(app);
  const cloudProxy = subscriptionQuery.data?.account?.proxy;
  const parsedCloudProxy = useMemo(() => {
    if (!cloudProxy) return null;
    const [user, server] = cloudProxy.split("@");
    const [proxyHost, proxyPort] = server.split(":");
    const [proxyUsername, proxyPassword] = user.split(":");

    return {
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    };
  }, [cloudProxy]);

  /** Whisker Message */
  useEffect(() => {
    if (import.meta.env.VITE_WHISKER) {
      if (!hasRestoredSettings) return;
      else {
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

              /** Expose Partition */
              window.WHISKER_PARTITION = account.partition;

              /** Update Account */
              updateActiveAccount(account);

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
    }
  }, [
    hasRestoredSettings,
    configureSettings,
    updateActiveAccount,
    getBackupData,
    restoreBackupData,
  ]);

  /** Update Proxy */
  useEffect(() => {
    if (!import.meta.env.VITE_WHISKER || !shareCloudProxy || !parsedCloudProxy)
      return;

    if (
      !account.proxyEnabled ||
      account.proxyHost !== parsedCloudProxy.proxyHost ||
      account.proxyPort !== parsedCloudProxy.proxyPort ||
      account.proxyUsername !== parsedCloudProxy.proxyUsername ||
      account.proxyPassword !== parsedCloudProxy.proxyPassword
    ) {
      sendWebviewMessage({
        action: "set-proxy",
        data: {
          ...parsedCloudProxy,
          proxyEnabled: true,
        },
      });
    }
  }, [
    shareCloudProxy,
    parsedCloudProxy,
    account.proxyEnabled,
    account.proxyHost,
    account.proxyPort,
    account.proxyUsername,
    account.proxyPassword,
  ]);
}
