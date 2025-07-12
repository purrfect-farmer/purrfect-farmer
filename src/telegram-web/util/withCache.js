const cache = new WeakMap();
export default function withCache(fn) {
    return (...args) => {
        let fnCache = cache.get(fn);
        const cacheKey = args.map(String).join('_');
        if (fnCache) {
            const cached = fnCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        else {
            fnCache = new Map();
            cache.set(fn, fnCache);
        }
        const newValue = fn(...args);
        fnCache.set(cacheKey, newValue);
        return newValue;
    };
}
