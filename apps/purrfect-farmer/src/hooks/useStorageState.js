import storage from "@/lib/storage";
import useChromeStorageKey from "./useChromeStorageKey";
import { useLayoutEffect } from "react";
import useRefCallback from "./useRefCallback";
import { useState } from "react";
import useValuesMemo from "./useValuesMemo";

export default function useStorageState(key, defaultValue, shared = false) {
  const storageKey = useChromeStorageKey(key, shared);
  const [value, setValue] = useState(
    () => storage.get(storageKey) || defaultValue,
  );

  /** Configure Value */
  const storeValue = useRefCallback(
    (newValue) => storage.set(storageKey, newValue),
    [storageKey],
  );

  /** Remove Value */
  const removeValue = useRefCallback(
    () => storage.remove(storageKey),
    [storageKey],
  );

  /** Watch Storage */
  const watchStorage = useRefCallback(
    (newValue) => {
      setValue(typeof newValue === "undefined" ? defaultValue : newValue);
    },
    [storageKey, defaultValue, setValue],
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
    storageKey,
  });
}
