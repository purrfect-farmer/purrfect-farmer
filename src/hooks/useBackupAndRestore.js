import useAppContext from "@/hooks/useAppContext";
import { postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";

export default function useBackupAndRestore(app) {
  const { messaging, setActiveTab, closeTab, configureSettings } =
    useAppContext() || app;

  /** Skip Onboarding */
  const skipOnboarding = useCallback(
    () => configureSettings("onboarded", true, false),
    [configureSettings]
  );

  const closeTelegramWeb = useCallback(() => {
    closeTab("telegram-web-k");
    closeTab("telegram-web-a");
  }, [closeTab]);

  /** Get Backup Data */
  const getBackupData = useCallback(
    () =>
      new Promise(async (resolve, reject) => {
        /** Skip Onboarding */
        await skipOnboarding();

        /** Close Telegram Web */
        await closeTelegramWeb();

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
    [messaging.handler, setActiveTab, skipOnboarding, closeTelegramWeb]
  );

  /** Restore Backup Data */
  const restoreBackupData = useCallback(
    (data) =>
      new Promise(async (resolve, reject) => {
        /** Skip Onboarding */
        await skipOnboarding();

        /** Close Telegram Web */
        await closeTelegramWeb();

        /** Wait for Port */
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
    [messaging.handler, setActiveTab, skipOnboarding, closeTelegramWeb]
  );

  return useMemo(
    () => [getBackupData, restoreBackupData],
    [getBackupData, restoreBackupData]
  );
}
