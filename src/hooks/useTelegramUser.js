import { sendWebviewMessage } from "@/lib/utils";
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
        await telegramClient.ref.current.startBotFromLink({
          link: import.meta.env.VITE_APP_BOT_MINI_APP,
          startOptions: {
            shouldWaitForReply: false,
          },
        });
      }

      const telegramWebApp = await telegramClient.ref.current.getTelegramWebApp(
        import.meta.env.VITE_APP_BOT_MINI_APP
      );

      await configureInitData({ telegramWebApp });
    },
    [configureInitData]
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
      (!telegramUser || telegramUser.shouldUpdate)
    ) {
      updateTelegramUser(telegramUser?.shouldUpdate);
    }
  }, [farmerMode, telegramUser, updateTelegramUser]);

  /** Set Init Data */
  useEffect(() => {
    if (import.meta.env.VITE_WHISKER) {
      sendWebviewMessage({
        action: "set-telegram-init-data",
        data: { telegramInitData },
      });
    }
  }, [telegramInitData]);

  return telegramUser;
}
