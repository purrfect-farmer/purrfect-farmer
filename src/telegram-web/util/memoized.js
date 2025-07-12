import { areSortedArraysEqual } from './iteratees';
const cache = new WeakMap();
export default function memoized(fn) {
    return (...args) => {
        const cached = cache.get(fn);
        if (cached && areSortedArraysEqual(cached.lastArgs, args)) {
            return cached.lastResult;
        }
        const result = fn(...args);
        cache.set(fn, { lastArgs: args, lastResult: result });
        return result;
    };
}
