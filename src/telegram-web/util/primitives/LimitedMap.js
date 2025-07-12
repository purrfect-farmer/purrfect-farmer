/**
 * A Map that has a limited size. When the limit is reached, the oldest entry is removed.
 * Ignores last access time, only cares about insertion order.
 */
export default class LimitedMap {
    limit;
    map;
    insertionQueue;
    constructor(limit) {
        this.limit = limit;
        this.map = new Map();
        this.insertionQueue = new Set();
    }
    get(key) {
        return this.map.get(key);
    }
    set(key, value) {
        if (this.map.size === this.limit) {
            const keyToRemove = Array.from(this.insertionQueue).shift();
            if (keyToRemove) {
                this.map.delete(keyToRemove);
                this.insertionQueue.delete(keyToRemove);
            }
        }
        this.map.set(key, value);
        this.insertionQueue.add(key);
        return this;
    }
    has(key) {
        return this.map.has(key);
    }
    delete(key) {
        const result = this.map.delete(key);
        if (result) {
            this.insertionQueue.delete(key);
        }
        return result;
    }
    clear() {
        this.map.clear();
        this.insertionQueue.clear();
    }
    forEach(callbackfn, thisArg) {
        this.map.forEach(callbackfn, thisArg);
    }
    get size() {
        return this.map.size;
    }
    get [Symbol.toStringTag]() {
        return this.map[Symbol.toStringTag];
    }
    [Symbol.iterator]() {
        return this.map[Symbol.iterator]();
    }
    entries() {
        return this.map.entries();
    }
    keys() {
        return this.map.keys();
    }
    values() {
        return this.map.values();
    }
}
