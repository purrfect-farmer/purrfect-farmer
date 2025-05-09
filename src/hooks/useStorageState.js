import { getChromeLocalStorage } from "@/lib/utils";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useState } from "react";

import useChromeStorageKey from "./useChromeStorageKey";
import useValuesMemo from "./useValuesMemo";

export default function useStorageState(key, defaultValue, shared = false) {
  const storageKey = useChromeStorageKey(key, shared);
  const [hasRestoredValue, setHasRestoredValue] = useState(false);
  const [value, setValue] = useState(defaultValue);

  /** Configure Value */
  const storeValue = useCallback(
    async (newValue) => {
      if (typeof chrome?.storage?.local !== "undefined") {
        return await chrome?.storage?.local.set({
          [storageKey]: newValue,
        });
      } else {
        return setValue(newValue);
      }
    },
    [storageKey, setValue]
  );

  /** Remove Value */
  const removeValue = useCallback(async () => {
    if (typeof chrome?.storage?.local !== "undefined") {
      return await chrome?.storage?.local.remove(storageKey);
    } else {
      return setValue(null);
    }
  }, [storageKey, setValue]);

  /** Watch Storage */
  const watchStorage = useCallback(
    ({ [storageKey]: item }) => {
      if (item) {
        setValue(
          typeof item.newValue !== "undefined" ? item.newValue : defaultValue
        );
      }
    },
    [storageKey, defaultValue, setValue]
  );

  /** Restore Value and Watch Storage */
  useLayoutEffect(() => {
    /** Restore Value */
    getChromeLocalStorage(storageKey, defaultValue).then(async (value) => {
      /** Get Keys */
      const keys = (await chrome?.storage?.local?.getKeys?.()) ?? [];

      /** Save in Storage */
      if (!keys.includes(storageKey)) {
        await chrome?.storage?.local?.set({
          [storageKey]: value,
        });
      }

      /** Set Value */
      setValue(value);
      setHasRestoredValue(true);
    });

    /** Listen for change */
    chrome?.storage?.local?.onChanged?.addListener(watchStorage);

    return () => {
      /** Remove Listener */
      chrome?.storage?.local?.onChanged?.removeListener(watchStorage);
    };
  }, [
    /** Deps */
    storageKey,
    setValue,
    watchStorage,
    getChromeLocalStorage,
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
