import { extractInitDataUnsafe, removeAccountStorage } from "@/utils";

import cryptoRandomString from "crypto-random-string";
import defaultAccounts from "@/core/defaultAccounts";
import defaultSharedSettings from "@/core/defaultSharedSettings";
import useBaseSettings from "./useBaseSettings";
import useCaptcha from "./useCaptcha";
import { useMemo } from "react";
import useMirror from "./useMirror";
import useMirroredCallback from "./useMirroredCallback";
import useMirroredState from "./useMirroredState";
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

  /** Account Picker State */
  const [
    showAccountPicker,
    setShowAccountPicker,
    dispatchAndSetShowAccountPicker,
  ] = useMirroredState("app.toggle-account-picker", false, mirror);

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

  /**
   * Auto-launch the only account at startup, otherwise show the account
   * launcher so the user can pick which account(s) to run.
   */
  const autoLaunch = persistedAccounts.length === 1;

  /** Active Account */
  const [active, setActive] = useState(
    autoLaunch ? persistedAccounts[0].id : null,
  );

  /** Running Accounts */
  const [running, setRunning] = useState(
    autoLaunch ? [persistedAccounts[0].id] : [],
  );

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
      if (!running.includes(id)) return;

      const remaining = running.filter((item) => item !== id);

      /** If Closing Active Account, Set Another as Active */
      if (id === active) {
        setActive(remaining[0] ?? null);
      }

      /** Closing the last account brings up the launcher; hide the picker */
      if (remaining.length === 0) {
        setShowAccountPicker(false);
      }

      /** Remove from Running Accounts */
      setRunning(remaining);
    },
    [active, running, setActive, setRunning, setShowAccountPicker],
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

  /** Remove Account
   *
   * Any account can be removed, including the last one — removing all
   * accounts brings up the launcher.
   */
  const removeAccount = useRefCallback(
    async (id) => {
      /** Updated List of Accounts */
      const updated = persistedAccounts.filter((item) => item.id !== id);

      /** Stop running it (updates active / picker / launcher) */
      closeAccount(id);

      /** Remove Account */
      await storePersistedAccounts(updated);

      /** Remove Storage */
      await removeAccountStorage(id);
    },
    [persistedAccounts, storePersistedAccounts, closeAccount],
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
    showAccountPicker,
    setShowAccountPicker,
    dispatchAndSetShowAccountPicker,
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
