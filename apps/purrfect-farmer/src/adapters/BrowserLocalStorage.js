export default class BrowserLocalStorage {
  static STORAGE_KEY = "chrome-local-storage";

  static getAll() {
    const data = localStorage.getItem(BrowserLocalStorage.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  static setItem(key, value) {
    const data = typeof key === "object" ? key : { [key]: value };
    const storageData = BrowserLocalStorage.getAll();

    for (const k in data) {
      storageData[k] = data[k];
    }

    localStorage.setItem(
      BrowserLocalStorage.STORAGE_KEY,
      JSON.stringify(storageData)
    );
  }

  static removeItem(key) {
    const itemsToRemove = Array.isArray(key) ? key : [key];
    const data = BrowserLocalStorage.getAll();
    for (const item of itemsToRemove) {
      delete data[item];
    }
    localStorage.setItem(BrowserLocalStorage.STORAGE_KEY, JSON.stringify(data));
  }

  static getItem(key, defaultValue) {
    const data = BrowserLocalStorage.getAll();
    return key in data ? data[key] : defaultValue;
  }

  static onChanged(callback) {
    window.addEventListener("storage", (event) => {
      if (
        event.storageArea !== localStorage ||
        event.key !== BrowserLocalStorage.STORAGE_KEY
      )
        return;

      const deleted = [];
      const updated = [];

      const oldValue = event.oldValue ? JSON.parse(event.oldValue) : {};
      const newValue = event.newValue ? JSON.parse(event.newValue) : {};

      for (const key in newValue) {
        updated.push({ key: key, value: newValue[key] });
      }

      for (const key in oldValue) {
        if (!(key in newValue)) {
          deleted.push(key);
        }
      }

      callback({ updated, deleted });
    });
  }
}
