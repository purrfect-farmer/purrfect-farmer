import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useState } from "react";

import useChromeStorageKey from "./useChromeStorageKey";
import useValuesMemo from "./useValuesMemo";
import storage from "@/lib/storage";

export default function useStorageState(key, defaultValue, shared = false) {
  const storageKey = useChromeStorageKey(key, shared);
  const [value, setValue] = useState(
    () => storage.get(storageKey) || defaultValue
  );

  /** Configure Value */
  const storeValue = useCallback(
    (newValue) => storage.set(storageKey, newValue),
    [storageKey]
  );

  /** Remove Value */
  const removeValue = useCallback(
    () => storage.remove(storageKey),
    [storageKey]
  );

  /** Watch Storage */
  const watchStorage = useCallback(
    (newValue) => {
      setValue(typeof newValue === "undefined" ? defaultValue : newValue);
    },
    [storageKey, defaultValue, setValue]
  );

  /** Restore Value and Watch Storage */
  useLayoutEffect(() => {
    /** Listen for change */
    storage.on(storageKey, watchStorage);

    return () => {
      /** Remove Listener */
      storage.off(storageKey, watchStorage);
    };
  }, [
    /** Deps */
    storageKey,
    setValue,
    watchStorage,
  ]);

  return useValuesMemo({
    value,
    setValue,
    storeValue,
    removeValue,
  });
}
