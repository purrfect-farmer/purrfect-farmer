import { useMemo } from "react";

import useStorageState from "./useStorageState";

export default function useLocalTelegramSession() {
  const { value: session, storeValue: setLocalTelegramSession } =
    useStorageState("localTelegramSession", null);

  return useMemo(
    () => [session, setLocalTelegramSession],
    [session, setLocalTelegramSession]
  );
}
