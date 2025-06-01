import EventEmitter from "events";
import isEqual from "fast-deep-equal";

export const storageCache = new Map();
export const storageEmitter = new EventEmitter();

/** Preload Storage */
export async function preloadStorage() {
  const data = await chrome?.storage?.local?.get(null);
  for (const storageKey in data) {
    storageCache.set(storageKey, data[storageKey]);
  }
}

/** Setup Emitter */
export function setupEmitter() {
  chrome?.storage?.local?.onChanged?.addListener?.((changes) => {
    for (const storageKey in changes) {
      const newValue = changes[storageKey].newValue;

      if (!isEqual(newValue, storageCache.get(storageKey))) {
        if (typeof newValue !== "undefined") {
          storageCache.set(storageKey, newValue);
        } else {
          storageCache.delete(storageKey);
        }
        storageEmitter.emit(storageKey, newValue);
      }
    }
  });
}

export async function setStorageValue(storageKey, newValue) {
  /** Set in Cache */
  storageCache.set(storageKey, newValue);

  /** Emit New Value */
  storageEmitter.emit(storageKey, newValue);

  /** Store in Chrome Local Storage */
  await chrome?.storage?.local?.set?.({
    [storageKey]: newValue,
  });
}

export async function removeStorageValue(storageKey) {
  /** Set in Cache */
  storageCache.delete(storageKey);

  /** Emit New Value */
  storageEmitter.emit(storageKey, undefined);

  /** Remove Storage */
  await chrome?.storage?.local?.remove?.(storageKey);
}

export async function setupChromeStorage() {
  /** Preload Storage */
  await preloadStorage();

  /** Setup Emitter */
  await setupEmitter();
}
