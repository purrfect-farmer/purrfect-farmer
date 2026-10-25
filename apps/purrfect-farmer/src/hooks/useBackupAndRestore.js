import storage from "@/lib/storage";
import { useCallback } from "react";
import { useMemo } from "react";
import useTelegramWebPort from "./useTelegramWebPort";

export default function useBackupAndRestore(app) {
  const { getLocalStorage, setLocalStorage } = useTelegramWebPort(app);

  /** Get Backup Data */
  const getBackupData = useCallback(async () => {
    const telegramWebLocalStorage = await getLocalStorage();
    const chromeLocalStorage = await storage.getAll();

    /** Remove GramJs:apiCache */
    delete telegramWebLocalStorage["GramJs:apiCache"];
    delete chromeLocalStorage["GramJs:apiCache"];

    return {
      version: __APP_PACKAGE_VERSION__,
      time: Date.now(),
      data: {
        telegramWebLocalStorage,
        chromeLocalStorage,
      },
    };
  }, [getLocalStorage]);

  /** Restore Backup Data */
  const restoreBackupData = useCallback(
    async (data) => {
      await setLocalStorage(data.telegramWebLocalStorage);
      await storage.set(data.chromeLocalStorage);

      return true;
    },
    [setLocalStorage],
  );

  return useMemo(
    () => [getBackupData, restoreBackupData],
    [getBackupData, restoreBackupData],
  );
}
