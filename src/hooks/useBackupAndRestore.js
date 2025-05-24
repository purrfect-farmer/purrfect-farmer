import useAppContext from "@/hooks/useAppContext";
import { postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";

export default function useBackupAndRestore() {
  const { messaging, setActiveTab, closeTab } = useAppContext();

  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
  }, [closeTab]);

  const getBackupData = useCallback(
    () =>
      new Promise(async (resolve, reject) => {
        /** Close Telegram Web */
        closeTelegramWeb();

        messaging.handler.once(
          `port-connected:telegram-web-k`,
          async (port) => {
            /** Get Telegram Web Local Storage */
            const telegramWebLocalStorage = await postPortMessage(port, {
              action: "get-local-storage",
            }).then((response) => response.data);

            /** Close Telegram Web */
            closeTelegramWeb();

            const chromeLocalStorage = await chrome.storage.local.get(null);
            const data = {
              version: __APP_VERSION__,
              time: Date.now(),
              data: {
                telegramWebLocalStorage,
                chromeLocalStorage,
              },
            };

            resolve(data);
          }
        );

        setActiveTab("telegram-web-k");
      }),
    [messaging.handler, closeTelegramWeb, setActiveTab]
  );

  const restoreBackupData = useCallback(
    (data) =>
      new Promise(async (resolve, reject) => {
        /** Close Telegram Web */
        closeTelegramWeb();

        messaging.handler.once(
          `port-connected:telegram-web-k`,
          async (port) => {
            /** Set Telegram Web Local Storage */
            await postPortMessage(port, {
              action: "set-local-storage",
              data: data.telegramWebLocalStorage,
            });

            /** Close Telegram Web */
            closeTelegramWeb();

            /** Restore Chrome Local Storage */
            await chrome.storage.local.set(data.chromeLocalStorage);

            /** Resolve */
            resolve(true);
          }
        );

        setActiveTab("telegram-web-k");
      }),
    [messaging.handler, closeTelegramWeb, setActiveTab]
  );

  return useMemo(
    () => [getBackupData, restoreBackupData],
    [getBackupData, restoreBackupData]
  );
}
