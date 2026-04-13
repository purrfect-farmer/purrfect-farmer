import toast from "react-hot-toast";
import { useMemo } from "react";
import useRefCallback from "./useRefCallback";
import useStorageState from "./useStorageState";
import useValuesMemo from "./useValuesMemo";

export default function useBaseSettings(key, defaultValue, shared = false) {
  const { value, storeValue: storeSettings } = useStorageState(
    key,
    defaultValue,
    shared,
  );

  /** Transform Value */
  const settings = useMemo(() => ({ ...defaultValue, ...value }), [value]);

  /** Update Settings */
  const updateSettings = useRefCallback(
    async (data, shouldToast = true) => {
      const newSettings = {
        ...settings,
        ...data,
      };

      /** Update Value */
      await storeSettings(newSettings);

      /** Toast */
      if (shouldToast) {
        toast.dismiss();
        toast.success("Settings Updated");
      }
    },
    [settings, storeSettings],
  );

  /** Configure Settings */
  const configureSettings = useRefCallback(
    async (k, v, shouldToast = true) =>
      updateSettings(
        {
          [k]: v,
        },
        shouldToast,
      ),
    [updateSettings],
  );

  return useValuesMemo({
    settings,
    storeSettings,

    configureSettings,
    updateSettings,
  });
}
