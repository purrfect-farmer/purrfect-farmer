import { NoTelegramWebAccountError } from "@/lib/telegramWebSession";
import { TELEGRAM_SESSION_STATUS } from "@purrfect/shared/enums/telegram-session-status";
import { getSessionStatus } from "@purrfect/shared/utils/sessionStatus";
import { useCallback } from "react";
import useAuthorizedTelegramClient from "./useAuthorizedTelegramClient";

/** Report whether the session the farmer runs on is still signed in */
export default function useTelegramSessionStatus(app) {
  const { acquire } = useAuthorizedTelegramClient(app);

  return useCallback(async () => {
    try {
      return await getSessionStatus(() => acquire({ verify: false }));
    } catch (error) {
      if (error instanceof NoTelegramWebAccountError) {
        return TELEGRAM_SESSION_STATUS.NO_SESSION;
      }

      console.error(error);

      return TELEGRAM_SESSION_STATUS.ERROR;
    }
  }, [acquire]);
}
