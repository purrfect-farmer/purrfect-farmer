import { useCallback } from "react";
import { useMemo } from "react";

import useMessageHandlers from "./useMessageHandlers";
import useStorageState from "./useStorageState";
import { BOT_TELEGRAM_WEB_APP_ACTION } from "./useCore";

export default function useTelegramUser(core) {
  const { value: telegramUser, storeValue: storeTelegramUser } =
    useStorageState("telegramUser", null);

  /** Configure User */
  const configureUser = useCallback(
    ({ telegramWebApp }) => {
      storeTelegramUser({
        ...telegramWebApp.initDataUnsafe.user,
        ["init_data"]: telegramWebApp.initData,
      });
    },
    [storeTelegramUser]
  );

  /** Handler */
  useMessageHandlers(
    useMemo(
      () => ({
        [BOT_TELEGRAM_WEB_APP_ACTION]: (message) => {
          configureUser(message.data);
        },
      }),
      [configureUser]
    ),
    core.messaging
  );

  return telegramUser;
}
