import toast from "react-hot-toast";
import { useCallback } from "react";
import { useMemo } from "react";

import useStorageState from "./useStorageState";
import useValuesMemo from "./useValuesMemo";

export default function useBaseSettings(key, defaultValue, shared = false) {
  const {
    value,
    hasRestoredValue: hasRestoredSettings,
    storeValue: storeSettings,
  } = useStorageState(key, defaultValue, shared);

  /** Transform Value */
  const settings = useMemo(() => ({ ...defaultValue, ...value }), [value]);

  /** Configure Settings */
  const configureSettings = useCallback(
    async (k, v, shouldToast = true) => {
      const newSettings = {
        ...settings,
        [k]: v,
      };

      /** Update Value */
      await storeSettings(newSettings);

      /** Toast */
      if (shouldToast) {
        toast.dismiss();
        toast.success("Settings Updated");
      }
    },
    [settings, storeSettings]
  );

  return useValuesMemo({
    settings,
    storeSettings,
    hasRestoredSettings,
    configureSettings,
  });
}
