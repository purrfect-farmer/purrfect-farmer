import defaultSettings from "@/core/defaultSettings";
import toast from "react-hot-toast";
import { useCallback } from "react";
import { useMemo } from "react";

import useStorageState from "./useStorageState";
import useValuesMemo from "./useValuesMemo";

export default function useSettings() {
  const {
    value,
    hasRestoredValue: hasRestoredSettings,
    storeValue,
  } = useStorageState("settings", defaultSettings);

  /** Transform Value */
  const settings = useMemo(() => ({ ...defaultSettings, ...value }), [value]);

  /** Configure Settings */
  const configureSettings = useCallback(
    async (k, v, shouldToast = true) => {
      const newSettings = {
        ...settings,
        [k]: v,
      };

      /** Update Value */
      await storeValue(newSettings);

      /** Toast */
      if (shouldToast) {
        toast.dismiss();
        toast.success("Settings Updated");
      }
    },
    [settings, storeValue]
  );

  /** Restore Settings */
  const restoreSettings = useCallback(async () => {
    /** Clear Storage */
    await chrome.storage.local.clear();

    /** Restore */
    await storeValue(defaultSettings);

    /** Toast */
    toast.dismiss();
    toast.success("Settings Restored");
  }, [defaultSettings, storeValue]);

  return useValuesMemo({
    settings,
    hasRestoredSettings,
    configureSettings,
    restoreSettings,
  });
}
