import { extractInitDataUnsafe, removeAccountStorage } from "@/utils";

import cryptoRandomString from "crypto-random-string";
import defaultAccounts from "@/core/defaultAccounts";
import defaultSharedSettings from "@/core/defaultSharedSettings";
import useBaseSettings from "./useBaseSettings";
import useCaptcha from "./useCaptcha";
import { useMemo } from "react";
import useMirror from "./useMirror";
import useMirroredCallback from "./useMirroredCallback";
import usePrimaryFarmer from "./usePrimaryFarmer";
import useRefCallback from "./useRefCallback";
import useSharedStorageState from "./useSharedStorageState";
import { useState } from "react";
import useValuesMemo from "./useValuesMemo";

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
    sharedSettings.mirrorServer,
  );

  /** Captcha Solver */
  const captcha = useCaptcha(
    sharedSettings.captchaEnabled,
    sharedSettings.captchaProvider,
    sharedSettings.captchaApiKey,
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
    mirror,
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
    mirror,
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
    [persistedAccounts, active, running],
  );

  const instances = useMemo(
    () => accounts.filter((account) => running.includes(account.id)),
    [accounts, running],
  );

  /** Launch Account */
  const launchAccount = useRefCallback((id) => {
    /** Add to Running Accounts */
    setRunning((prev) => (prev.includes(id) ? prev : [...prev, id]));

    /** Set Active Account */
    setActive(id);
  }, []);

  /** Close Account */
  const closeAccount = useRefCallback(
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
    [active, running, setActive, setRunning],
  );

  /** Add Account */
  const addAccount = useRefCallback(async () => {
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
  const updateAccount = useRefCallback(
    (id, data) => {
      storePersistedAccounts(
        persistedAccounts.map((item) =>
          item.id === id ? { ...item, ...data } : item,
        ),
      );
    },
    [persistedAccounts, storePersistedAccounts],
  );

  /** Remove Account */
  const removeAccount = useRefCallback(
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
    [persistedAccounts, storePersistedAccounts, launchAccount],
  );

  /** Primary farmer configurations */
  const {
    dispatchToGetPrimaryFarmerLink,
    dispatchToSetPrimaryFarmerLink,
    dispatchToSetPrimaryFarmerUserId,
  } = usePrimaryFarmer(mirror);

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
    dispatchToSetPrimaryFarmerUserId,
    dispatchToGetPrimaryFarmerLink,
    dispatchToSetPrimaryFarmerLink,

    configureSharedSettings,
    updateSharedSettings,
    storePersistedAccounts,
    storeSharedSettings,
  });
}
