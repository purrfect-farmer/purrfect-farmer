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
import useCaptcha from "./useCaptcha";

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

  /** Captcha Solver */
  const captcha = useCaptcha(
    sharedSettings.captchaEnabled,
    sharedSettings.captchaProvider,
    sharedSettings.captchaApiKey
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
  const [active, setActive] = useState(persistedAccounts[0].id);

  /** Running Accounts */
  const [running, setRunning] = useState([active]);

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
          active: item.id === active,
          running: running.includes(item.id),
          persisted: item,
        };
      }),
    [persistedAccounts, active, running]
  );

  const instances = useMemo(
    () => accounts.filter((account) => running.includes(account.id)),
    [accounts, running]
  );

  /** Launch Account */
  const launchAccount = useCallback((id) => {
    /** Add to Running Accounts */
    setRunning((prev) => (prev.includes(id) ? prev : [...prev, id]));

    /** Set Active Account */
    setActive(id);
  }, []);

  /** Close Account */
  const closeAccount = useCallback(
    (id) => {
      if (running.length > 1) {
        /** If Closing Active Account, Set Another as Active */
        if (id === active) {
          const nextActive = running.find((item) => item !== id);
          setActive(nextActive);
        }

        /** Remove from Running Accounts */
        setRunning((prev) => prev.filter((item) => item !== id));
      }
    },
    [active, running, setActive, setRunning]
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
  }, [persistedAccounts, storePersistedAccounts, setActive, launchAccount]);

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

        /** Launch Another Account */
        launchAccount(updated[0].id);
      }
    },
    [persistedAccounts, storePersistedAccounts, launchAccount]
  );

  return useValuesMemo({
    mirror,
    captcha,
    active,
    accounts,
    running,
    instances,
    sharedSettings,
    persistedAccounts,
    addAccount,
    updateAccount,
    removeAccount,
    launchAccount,
    closeAccount,
    setActive,
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
