import defaultSettings from "@/core/defaultSettings";
import toast from "react-hot-toast";
import { removeAccountStorage } from "@/utils";
import { useCallback } from "react";

import useAccountContext from "./useAccountContext";
import useBaseSettings from "./useBaseSettings";
import useValuesMemo from "./useValuesMemo";

export default function useSettings() {
  const account = useAccountContext();
  const { settings, storeSettings, configureSettings, updateSettings } =
    useBaseSettings("settings", defaultSettings);

  /** Restore Settings */
  const restoreSettings = useCallback(async () => {
    /** Remove Storage */
    await removeAccountStorage(account.id);

    /** Toast */
    toast.dismiss();
    toast.success("Settings Restored");
  }, [account.id, storeSettings]);

  return useValuesMemo({
    settings,
    storeSettings,
    configureSettings,
    updateSettings,
    restoreSettings,
  });
}
