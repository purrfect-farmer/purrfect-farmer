import { BOT_TELEGRAM_WEB_APP_ACTION } from "./useCore";
import { sendWebviewMessage } from "@/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import useMessageHandlers from "./useMessageHandlers";
import useTelegramInitData from "./useTelegramInitData";

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

  const willUpdateUser = !telegramUser || telegramUser.shouldUpdate;
  const canUpdateUser = farmerMode === "session" && willUpdateUser;
  const isUpdateNeeded = Boolean(telegramUser?.shouldUpdate);

  /** Configure InitData */
  const configureInitData = useCallback(
    ({ telegramWebApp }) => {
      updateActiveAccount({
        telegramInitData: telegramWebApp.initData,
      });
    },
    [updateActiveAccount],
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
        import.meta.env.VITE_APP_BOT_MINI_APP,
      );

      await configureInitData({ telegramWebApp });
    },
    [configureInitData],
  );

  /** Handler */
  useMessageHandlers(
    useMemo(
      () => ({
        [BOT_TELEGRAM_WEB_APP_ACTION]: (message) => {
          console.log("Configuring init data from mini-app...");
          configureInitData(message.data);
        },
      }),
      [configureInitData],
    ),
    messaging,
  );

  /** Get Telegram User */
  useEffect(() => {
    if (canUpdateUser) {
      console.log("Updating Telegram User...", {
        canUpdateUser,
        isUpdateNeeded,
      });
      updateTelegramUser(isUpdateNeeded);
    }
  }, [canUpdateUser, isUpdateNeeded, updateTelegramUser]);

  /** Set Init Data */
  useEffect(() => {
    if (import.meta.env.VITE_WHISKER) {
      console.log("Setting telegram init-data in Whisker...");
      sendWebviewMessage({
        action: "set-telegram-init-data",
        data: { telegramInitData },
      });
    }
  }, [telegramInitData]);

  return telegramUser;
}
