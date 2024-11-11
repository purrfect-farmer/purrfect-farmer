import defaultSettings from "@/defaultSettings";
import toast from "react-hot-toast";
import { getSettings } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useState } from "react";

import useValuesMemo from "./useValuesMemo";

export default function useSettings() {
  const [hasRestoredSettings, setHasRestoredSettings] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  /** Configure Settings */
  const configureSettings = useCallback(
    async (k, v, shouldToast = true) => {
      const newSettings = {
        ...settings,
        [k]: v,
      };

      await chrome?.storage?.local.set({
        settings: newSettings,
      });

      if (shouldToast) {
        toast.dismiss();
        toast.success("Settings Updated");
      }
    },
    [settings]
  );

  /** Set initial settings */
  useEffect(() => {
    getSettings().then((settings) => {
      setSettings(settings);
      setHasRestoredSettings(true);
    });

    const watchStorage = ({ settings }) => {
      if (settings) {
        setSettings(settings.newValue);
      }
    };

    /** Listen for change */
    chrome?.storage?.local?.onChanged.addListener(watchStorage);

    return () => {
      /** Remove Listener */
      chrome?.storage?.local?.onChanged.removeListener(watchStorage);
    };
  }, [getSettings, setSettings, setHasRestoredSettings]);

  return useValuesMemo({ settings, hasRestoredSettings, configureSettings });
}
