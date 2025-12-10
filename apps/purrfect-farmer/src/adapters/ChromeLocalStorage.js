export default class ChromeLocalStorage {
  static getAll() {
    return chrome.storage.local.get(null);
  }

  static setItem(key, value) {
    const data = typeof key === "object" ? key : { [key]: value };
    return chrome.storage.local.set(data);
  }

  static removeItem(key) {
    const itemsToRemove = Array.isArray(key) ? key : [key];
    return chrome.storage.local.remove(itemsToRemove);
  }

  static getItem(key, defaultValue) {
    const { [key]: value } = chrome.storage.local.get({ [key]: defaultValue });
    return typeof value === "undefined" ? defaultValue : value;
  }

  static onChanged(callback) {
    chrome.storage.onChanged.addListener((changes) => {
      const deleted = [];
      const updated = [];

      for (const storageKey in changes) {
        const newValue = changes[storageKey].newValue;

        if (typeof newValue !== "undefined") {
          updated.push({ key: storageKey, value: newValue });
        } else {
          deleted.push(storageKey);
        }
      }

      callback({ updated, deleted });
    });
  }
}
