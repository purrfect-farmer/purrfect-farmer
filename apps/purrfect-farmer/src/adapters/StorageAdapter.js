import EventEmitter from "events";
import isEqual from "fast-deep-equal";
import ChromeLocalStorage from "./ChromeLocalStorage";
import BrowserLocalStorage from "./BrowserLocalStorage";

export default class StorageAdapter {
  constructor() {
    this.adapter =
      typeof chrome?.storage?.local !== "undefined"
        ? ChromeLocalStorage
        : BrowserLocalStorage;

    this.cache = new Map();
    this.emitter = new EventEmitter();
    this.preloaded = false;
  }

  async getAll() {
    if (this.preloaded) {
      return Object.fromEntries(this.cache.entries());
    }

    return this.adapter.getAll();
  }

  async setItem(key, value) {
    await this.adapter.setItem(key, value);
  }

  async removeItem(key) {
    await this.adapter.removeItem(key);
  }

  async getItem(key, defaultValue) {
    return this.adapter.getItem(key, defaultValue);
  }

  async preload() {
    if (this.preloaded) return;

    const data = await this.getAll();
    for (const storageKey in data) {
      this.cache.set(storageKey, data[storageKey]);
    }
  }

  async setupEmitter() {
    if (this.preloaded) return;

    this.adapter.onChanged(({ updated, deleted }) => {
      for (const { key, value } of updated) {
        const cachedValue = this.cache.get(key);

        if (!isEqual(cachedValue, value)) {
          this.cache.set(key, value);
          this.emitter.emit(key, value);
        }
      }

      for (const key of deleted) {
        if (this.cache.has(key)) {
          this.cache.delete(key);
          this.emitter.emit(key, undefined);
        }
      }
    });
  }

  async setup() {
    await this.preload();
    await this.setupEmitter();

    this.preloaded = true;
  }

  get(key, defaultValue) {
    if (this.preloaded) {
      return this.cache.has(key) ? this.cache.get(key) : defaultValue;
    }

    return this.adapter.getItem(key, defaultValue);
  }

  set(key, value) {
    const data = typeof key === "object" ? key : { [key]: value };

    for (const [key, value] of Object.entries(data)) {
      this.cache.set(key, value);
      this.emitter.emit(key, value);
    }

    return this.adapter.setItem(data);
  }

  remove(key) {
    const itemsToRemove = Array.isArray(key) ? key : [key];

    for (const k of itemsToRemove) {
      this.cache.delete(k);
      this.emitter.emit(k, undefined);
    }

    return this.adapter.removeItem(itemsToRemove);
  }

  on(event, listener) {
    this.emitter.on(event, listener);
  }

  off(event, listener) {
    this.emitter.off(event, listener);
  }
}
