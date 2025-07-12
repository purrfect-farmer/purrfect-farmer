import { clear, createStore, del, delMany, entries as getEntries, get, getMany, keys as getKeys, set, setMany, update, values as getValues, } from 'idb-keyval';
class IdbStore {
    store;
    constructor(name) {
        this.store = createStore(name, 'store');
    }
    set(key, value) {
        return set(key, value, this.store);
    }
    setMany(entries) {
        return setMany(entries, this.store);
    }
    get(key) {
        return get(key, this.store);
    }
    getMany(keys) {
        return getMany(keys, this.store);
    }
    clear() {
        return clear(this.store);
    }
    del(key) {
        return del(key, this.store);
    }
    delMany(keys) {
        return delMany(keys, this.store);
    }
    entries() {
        return getEntries(this.store);
    }
    keys() {
        return getKeys(this.store);
    }
    values() {
        return getValues(this.store);
    }
    update(key, updater) {
        return update(key, updater, this.store);
    }
}
export const MAIN_IDB_STORE = new IdbStore('tt-data');
export const PASSCODE_IDB_STORE = new IdbStore('tt-passcode');
