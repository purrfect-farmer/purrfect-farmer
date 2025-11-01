import cryptoRandomString from "crypto-random-string";
import defaultAccounts from "@/core/defaultAccounts";
import defaultSharedSettings from "@/core/defaultSharedSettings";
import { extractInitDataUnsafe, removeAccountStorage } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useBaseSettings from "./useBaseSettings";
import useValuesMemo from "./useValuesMemo";
import useMirror from "./useMirror";
import useMirroredCallback from "./useMirroredCallback";
import useSharedStorageState from "./useSharedStorageState";

export default function useSharedCore() {
  /** Shared Settings */
  const {
    settings: sharedSettings,
    storeSettings: storeSharedSettings,
    configureSettings: configureSharedSettings,
    updateSettings: updateSharedSettings,
  } = useBaseSettings("settings", defaultSharedSettings, true);

  /** Mirror */
  const mirror = useMirror(
    sharedSettings.enableMirror,
    sharedSettings.mirrorServer
  );

  /** Persisted Accounts */
  const { value: persistedAccounts, storeValue: storePersistedAccounts } =
    useSharedStorageState("accounts", defaultAccounts);

  /** Headless Mode */
  const [headlessMode, setHeadlessMode] = useState(false);

  /** Headless Farmers */
  const [headlessFarmers, setHeadlessFarmers] = useState([]);

  /** Start Headless Mode */
  const [startHeadlessMode, dispatchAndStartHeadlessMode] = useMirroredCallback(
    "headless-mode.start",
    (ids) => {
      setHeadlessFarmers(ids);
      setHeadlessMode(true);
    },
    [],
    /** Mirror */
    mirror
  );

  /** Stop Headless Mode */
  const [stopHeadlessMode, dispatchAndStopHeadlessMode] = useMirroredCallback(
    "headless-mode.stop",
    () => {
      setHeadlessFarmers([]);
      setHeadlessMode(false);
    },
    [],
    /** Mirror */
    mirror
  );

  /** Active Account */
  const [activeAccount, setActiveAccount] = useState(persistedAccounts[0].id);

  /** Running Accounts */
  const [runningAccounts, setRunningAccounts] = useState([activeAccount]);

  /** Mapped Accounts */
  const accounts = useMemo(
    () =>
      persistedAccounts.map((item, index) => {
        const telegramInitDataUnsafe = item.telegramInitData
          ? extractInitDataUnsafe(item.telegramInitData)
          : null;

        return {
          ...item,
          index,
          telegramInitDataUnsafe,
          user: telegramInitDataUnsafe?.["user"] || null,
          active: item.id === activeAccount,
          running: runningAccounts.includes(item.id),
        };
      }),
    [persistedAccounts, activeAccount, runningAccounts]
  );

  /** Launch Account */
  const launchAccount = useCallback((id) => {
    /** Add to Running Accounts */
    setRunningAccounts((prev) => (prev.includes(id) ? prev : [...prev, id]));

    /** Set Active Account */
    setActiveAccount(id);
  }, []);

  /** Close Account */
  const closeAccount = useCallback(
    (id) => {
      if (runningAccounts.length > 1) {
        /** If Closing Active Account, Set Another as Active */
        if (id === activeAccount) {
          const nextActive = runningAccounts.find((item) => item !== id);
          setActiveAccount(nextActive);
        }

        /** Remove from Running Accounts */
        setRunningAccounts((prev) => prev.filter((item) => item !== id));
      }
    },
    [activeAccount, runningAccounts, setActiveAccount, setRunningAccounts]
  );

  /** Add Account */
  const addAccount = useCallback(async () => {
    /** New Account */
    const newPersistedAccount = {
      id: cryptoRandomString({
        length: 10,
      }),
      title: `Account ${persistedAccounts.length + 1}`,
      telegramInitData: null,
    };

    /** Store Account */
    await storePersistedAccounts([...persistedAccounts, newPersistedAccount]);

    /** Launch Account */
    launchAccount(newPersistedAccount.id);
  }, [
    persistedAccounts,
    storePersistedAccounts,
    setActiveAccount,
    launchAccount,
  ]);

  /** Update Account */
  const updateAccount = useCallback(
    (id, data) => {
      storePersistedAccounts(
        persistedAccounts.map((item) =>
          item.id === id ? { ...item, ...data } : item
        )
      );
    },
    [persistedAccounts, storePersistedAccounts]
  );

  /** Remove Account */
  const removeAccount = useCallback(
    async (id) => {
      if (persistedAccounts.length > 1) {
        /** Updated List of Accounts */
        const updated = persistedAccounts.filter((item) => item.id !== id);

        /** Remove Account */
        await storePersistedAccounts(updated);

        /** Remove Storage */
        await removeAccountStorage(id);

        /** Close Account */
        closeAccount(id);

        /** Launch Another Account */
        launchAccount(updated[0].id);
      }
    },
    [persistedAccounts, storePersistedAccounts, launchAccount, closeAccount]
  );

  return useValuesMemo({
    mirror,
    accounts,
    activeAccount,
    sharedSettings,
    runningAccounts,
    addAccount,
    updateAccount,
    removeAccount,
    launchAccount,
    closeAccount,
    setActiveAccount,
    headlessMode,
    headlessFarmers,
    startHeadlessMode,
    stopHeadlessMode,
    dispatchAndStartHeadlessMode,
    dispatchAndStopHeadlessMode,

    configureSharedSettings,
    updateSharedSettings,
    storePersistedAccounts,
    storeSharedSettings,
  });
}
