import cryptoRandomString from "crypto-random-string";
import defaultAccounts from "@/core/defaultAccounts";
import defaultSharedSettings from "@/core/defaultSharedSettings";
import { extractInitDataUnsafe, removeAccountStorage } from "@/lib/utils";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useBaseSettings from "./useBaseSettings";
import useStorageState from "./useStorageState";
import useValuesMemo from "./useValuesMemo";

export default function useSharedCore() {
  /** Shared Settings */
  const {
    settings: sharedSettings,
    storeSettings: storeSharedSettings,
    configureSettings: configureSharedSettings,
    updateSettings: updateSharedSettings,
    hasRestoredSettings: hasRestoredSharedSettings,
  } = useBaseSettings("settings", defaultSharedSettings, true);

  /** Persisted Accounts */
  const {
    value: persistedAccounts,
    hasRestoredValue: hasRestoredAccounts,
    storeValue: storePersistedAccounts,
  } = useStorageState("accounts", defaultAccounts, true);

  /** Active Account */
  const [activeAccount, setActiveAccount] = useState(persistedAccounts[0].id);

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
        };
      }),
    [persistedAccounts, activeAccount]
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

    /** Set Active Account */
    setActiveAccount(newPersistedAccount.id);
  }, [persistedAccounts, storePersistedAccounts, setActiveAccount]);

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

        /** Set Active Account */
        setActiveAccount(updated[0].id);
      }
    },
    [persistedAccounts, storePersistedAccounts, setActiveAccount]
  );

  /** Set First Account as Active */
  useLayoutEffect(() => {
    if (hasRestoredAccounts) {
      setActiveAccount(persistedAccounts[0].id);
    }
  }, [hasRestoredAccounts]);

  return useValuesMemo({
    accounts,
    activeAccount,
    sharedSettings,
    addAccount,
    updateAccount,
    removeAccount,
    setActiveAccount,
    hasRestoredAccounts,
    hasRestoredSharedSettings,
    configureSharedSettings,
    updateSharedSettings,
    storePersistedAccounts,
    storeSharedSettings,
  });
}
