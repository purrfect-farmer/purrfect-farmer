import { extractInitDataUnsafe } from "@/lib/utils";
import { isBefore, subMinutes } from "date-fns";
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

  const telegramUser = useMemo(() => {
    if (telegramInitData) {
      const parsed = extractInitDataUnsafe(telegramInitData);
      const shouldUpdate = isBefore(
        new Date(parsed["auth_date"] * 1000),
        subMinutes(new Date(), 10)
      );

      return {
        user: parsed["user"],
        initData: telegramInitData,
        shouldUpdate,
      };
    } else {
      return null;
    }
  }, [telegramInitData]);

  /** Configure InitData */
  const configureInitData = useCallback(
    ({ telegramWebApp }) => {
      storeTelegramInitData(telegramWebApp.initData);
    },
    [storeTelegramInitData]
  );

  const updateTelegramUser = useCallback(async () => {
    await telegramClient.startBotFromLink(
      import.meta.env.VITE_APP_BOT_MINI_APP,
      {
        shouldWaitForReply: false,
      }
    );

    const telegramWebApp = await telegramClient.getTelegramWebApp(
      import.meta.env.VITE_APP_BOT_MINI_APP
    );

    await configureInitData({ telegramWebApp });
  }, [
    telegramClient.startBotFromLink,
    telegramClient.getTelegramWebApp,
    configureInitData,
  ]);

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

  /** Get Telegram User */
  useEffect(() => {
    if (
      farmerMode === "session" &&
      (telegramUser === null || telegramUser.shouldUpdate)
    ) {
      updateTelegramUser();
    }
  }, [farmerMode, telegramUser, updateTelegramUser]);

  return telegramUser;
}
