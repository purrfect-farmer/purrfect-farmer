import { useMemo } from "react";

import useStorageState from "./useStorageState";

export default function useCloudTelegramSession() {
  const { value: session, storeValue: setCloudTelegramSession } =
    useStorageState("cloudTelegramSession", null);

  return useMemo(
    () => [session, setCloudTelegramSession],
    [session, setCloudTelegramSession]
  );
}
