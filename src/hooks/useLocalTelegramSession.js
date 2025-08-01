import { useMemo } from "react";

import useStorageState from "./useStorageState";

export default function useLocalTelegramSession() {
  const { value: session, storeValue: setLocalTelegramSession } =
    useStorageState(
      "local-telegram-session",
      import.meta.env.VITE_LOCAL_TELEGRAM_SESSION || null
    );

  return useMemo(
    () => [session, setLocalTelegramSession],
    [session, setLocalTelegramSession]
  );
}
