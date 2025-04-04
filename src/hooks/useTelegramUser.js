import { extractInitDataUnsafe } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";

import useMessageHandlers from "./useMessageHandlers";
import useStorageState from "./useStorageState";
import { BOT_TELEGRAM_WEB_APP_ACTION } from "./useCore";

export default function useTelegramUser(core) {
  const { farmerMode, messaging, telegramClient } = core;
  const { value: telegramInitData, storeValue: storeTelegramInitData } =
    useStorageState("telegramInitData", null);

  const telegramUser = useMemo(
    () =>
      telegramInitData
        ? {
            user: extractInitDataUnsafe(telegramInitData).user,
            initData: telegramInitData,
          }
        : null,
    [telegramInitData]
  );

  /** Configure InitData */
  const configureInitData = useCallback(
    ({ telegramWebApp }) => {
      storeTelegramInitData(telegramWebApp.initData);
    },
    [storeTelegramInitData]
  );

  /** Handler */
  useMessageHandlers(
    useMemo(
      () => ({
        [BOT_TELEGRAM_WEB_APP_ACTION]: (message) => {
          configureInitData(message.data);
        },
      }),
      [configureInitData]
    ),
    messaging
  );

  /** Get TelegramWebApp */
  useEffect(() => {
    if (farmerMode === "session" && telegramInitData === null) {
      telegramClient
        .getTelegramWebApp(import.meta.env.VITE_APP_BOT_MINI_APP)
        .then((telegramWebApp) => {
          configureInitData({ telegramWebApp });
        });
    }
  }, [
    farmerMode,
    telegramInitData,
    telegramClient.getTelegramWebApp,
    configureInitData,
  ]);

  return telegramUser;
}
