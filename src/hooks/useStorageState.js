import { getStorage } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useState } from "react";

import useValuesMemo from "./useValuesMemo";

export default function useStorageState(key, defaultValue) {
  const [hasRestoredValue, setHasRestoredValue] = useState(false);
  const [value, setValue] = useState(defaultValue);

  /** Configure Value */
  const storeValue = useCallback(
    async (newValue) => {
      return await chrome?.storage?.local.set({
        [key]: newValue,
      });
    },
    [key]
  );

  /** Restore Value and Watch Storage */
  useEffect(() => {
    /** Restore Value */
    getStorage(key, defaultValue).then((value) => {
      setValue(value);
      setHasRestoredValue(true);
    });

    /** Watch Storage */
    const watchStorage = ({ [key]: item }) => {
      if (item) {
        setValue(item.newValue);
      }
    };

    /** Listen for change */
    chrome?.storage?.local?.onChanged.addListener(watchStorage);

    return () => {
      /** Remove Listener */
      chrome?.storage?.local?.onChanged.removeListener(watchStorage);
    };
  }, [key, getStorage, setValue, setHasRestoredValue]);

  return useValuesMemo({ value, hasRestoredValue, setValue, storeValue });
}
