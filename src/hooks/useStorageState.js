import {
  removeStorageValue,
  setStorageValue,
  storageCache,
  storageEmitter,
} from "@/lib/chrome-storage";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useState } from "react";

import useChromeStorageKey from "./useChromeStorageKey";
import useValuesMemo from "./useValuesMemo";

export default function useStorageState(key, defaultValue, shared = false) {
  const storageKey = useChromeStorageKey(key, shared);
  const [value, setValue] = useState(
    () => storageCache.get(storageKey) || defaultValue
  );

  /** Configure Value */
  const storeValue = useCallback(
    async (newValue) => setValue(await setStorageValue(storageKey, newValue)),
    [storageKey, setValue]
  );

  /** Remove Value */
  const removeValue = useCallback(
    async () => setValue(await removeStorageValue(storageKey)),
    [storageKey, setValue]
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
    storageEmitter.on(storageKey, watchStorage);

    return () => {
      /** Remove Listener */
      storageEmitter.off(storageKey, watchStorage);
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
