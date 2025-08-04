import { useMemo } from "react";

import useStorageState from "./useStorageState";

export default function useCloudTelegramSession() {
  const { value: session, storeValue: setCloudTelegramSession } =
    useStorageState("cloud-telegram-session", null);

  return useMemo(
    () => [session, setCloudTelegramSession],
    [session, setCloudTelegramSession]
  );
}
