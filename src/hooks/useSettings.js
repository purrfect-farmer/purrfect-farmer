import defaultSettings from "@/default-settings";
import toast from "react-hot-toast";
import { getSettings } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

export default function useSettings() {
  const [settings, setSettings] = useState(defaultSettings);

  /** Configure Settings */
  const configureSettings = useCallback(
    async (k, v) => {
      const newSettings = {
        ...settings,
        [k]: v,
      };

      await chrome?.storage?.local.set({
        settings: newSettings,
      });

      setSettings(newSettings);

      toast.dismiss();
      toast.success("Settings Updated");
    },
    [settings, setSettings]
  );

  /** Set initial settings */
  useEffect(() => {
    getSettings().then((settings) => {
      setSettings(settings);
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
  }, [getSettings, setSettings]);

  return useMemo(
    () => ({ settings, configureSettings }),
    [settings, configureSettings]
  );
}
