import defaultSettings from "@/defaultSettings";
import toast from "react-hot-toast";
import { useCallback } from "react";

import useStorageState from "./useStorageState";
import useValuesMemo from "./useValuesMemo";

export default function useSettings() {
  const {
    value: settings,
    hasRestoredValue: hasRestoredSettings,
    storeValue,
  } = useStorageState("settings", defaultSettings);

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

  return useValuesMemo({ settings, hasRestoredSettings, configureSettings });
}
