import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";

import useMessageHandlers from "./useMessageHandlers";
import useTelegramInitData from "./useTelegramInitData";
import { BOT_TELEGRAM_WEB_APP_ACTION } from "./useCore";

export default function useTelegramUser(core) {
  const {
    account,
    farmerMode,
    messaging,
    telegramClient,
    updateActiveAccount,
  } = core;
  const { telegramInitData } = account;
  const telegramUser = useTelegramInitData(telegramInitData);

  /** Configure InitData */
  const configureInitData = useCallback(
    ({ telegramWebApp }) => {
      updateActiveAccount({
        telegramInitData: telegramWebApp.initData,
      });
    },
    [updateActiveAccount]
  );

  const updateTelegramUser = useCallback(
    async (isUpdate = false) => {
      if (isUpdate === false) {
        await telegramClient.startBotFromLink(
          import.meta.env.VITE_APP_BOT_MINI_APP,
          {
            shouldWaitForReply: false,
          }
        );
      }

      const telegramWebApp = await telegramClient.getTelegramWebApp(
        import.meta.env.VITE_APP_BOT_MINI_APP
      );

      await configureInitData({ telegramWebApp });
    },
    [
      telegramClient.startBotFromLink,
      telegramClient.getTelegramWebApp,
      configureInitData,
    ]
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

  /** Get Telegram User */
  useEffect(() => {
    if (
      farmerMode === "session" &&
      (telegramUser === null || telegramUser.shouldUpdate)
    ) {
      updateTelegramUser(telegramUser?.shouldUpdate);
    }
  }, [farmerMode, telegramUser, updateTelegramUser]);

  return telegramUser;
}
