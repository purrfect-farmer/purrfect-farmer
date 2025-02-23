import { getStorage } from "@/lib/utils";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useState } from "react";

import useValuesMemo from "./useValuesMemo";

export default function useStorageState(key, defaultValue) {
  const [hasRestoredValue, setHasRestoredValue] = useState(false);
  const [value, setValue] = useState(defaultValue);

  /** Configure Value */
  const storeValue = useCallback(
    async (newValue) => {
      if (typeof chrome?.storage?.local !== "undefined") {
        return await chrome?.storage?.local.set({
          [key]: newValue,
        });
      } else {
        return setValue(newValue);
      }
    },
    [key, setValue]
  );

  /** Remove Value */
  const removeValue = useCallback(async () => {
    if (typeof chrome?.storage?.local !== "undefined") {
      return await chrome?.storage?.local.remove(key);
    } else {
      return setValue(null);
    }
  }, [key, setValue]);

  /** Restore Value and Watch Storage */
  useLayoutEffect(() => {
    /** Restore Value */
    getStorage(key, defaultValue).then((value) => {
      setValue(value);
      setHasRestoredValue(true);
    });

    /** Watch Storage */
    const watchStorage = ({ [key]: item }) => {
      if (item) {
        setValue(
          typeof item.newValue !== "undefined" ? item.newValue : defaultValue
        );
      }
    };

    /** Listen for change */
    chrome?.storage?.local?.onChanged.addListener(watchStorage);

    return () => {
      /** Remove Listener */
      chrome?.storage?.local?.onChanged.removeListener(watchStorage);
    };
  }, [
    /** Deps */
    key,
    getStorage,
    setValue,
    setHasRestoredValue,
  ]);

  return useValuesMemo({
    value,
    hasRestoredValue,
    setValue,
    storeValue,
    removeValue,
  });
}
