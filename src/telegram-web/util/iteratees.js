export function buildCollectionByKey(collection, key) {
    return collection.reduce((byKey, member) => {
        byKey[member[key]] = member;
        return byKey;
    }, {});
}
export function buildCollectionByCallback(collection, callback) {
    return collection.reduce((byKey, member) => {
        const [key, value] = callback(member);
        byKey[key] = value;
        return byKey;
    }, {});
}
export function mapValues(byKey, callback) {
    return Object.keys(byKey).reduce((newByKey, key, index) => {
        newByKey[key] = callback(byKey[key], key, index, byKey);
        return newByKey;
    }, {});
}
export function pick(object, keys) {
    return keys.reduce((result, key) => {
        result[key] = object[key];
        return result;
    }, {});
}
export function pickTruthy(object, keys) {
    return keys.reduce((result, key) => {
        if (object[key]) {
            result[key] = object[key];
        }
        return result;
    }, {});
}
export function omit(object, keys) {
    const stringKeys = new Set(keys.map(String));
    const savedKeys = Object.keys(object)
        .filter((key) => !stringKeys.has(key));
    return pick(object, savedKeys);
}
export function omitUndefined(object) {
    return Object.keys(object).reduce((result, stringKey) => {
        const key = stringKey;
        if (object[key] !== undefined) {
            result[key] = object[key];
        }
        return result;
    }, {});
}
export function orderBy(collection, orderRule, mode = 'asc') {
    function compareValues(a, b, currentOrderRule, isAsc) {
        const aValue = (typeof currentOrderRule === 'function' ? currentOrderRule(a) : a[currentOrderRule]) || 0;
        const bValue = (typeof currentOrderRule === 'function' ? currentOrderRule(b) : b[currentOrderRule]) || 0;
        // @ts-expect-error Rely on the JS to handle the comparison
        return isAsc ? aValue - bValue : bValue - aValue;
    }
    if (Array.isArray(orderRule)) {
        const [mode1, mode2] = Array.isArray(mode) ? mode : [mode, mode];
        const [orderRule1, orderRule2] = orderRule;
        const isAsc1 = mode1 === 'asc';
        const isAsc2 = mode2 === 'asc';
        return collection.sort((a, b) => {
            return compareValues(a, b, orderRule1, isAsc1) || compareValues(a, b, orderRule2, isAsc2);
        });
    }
    const isAsc = mode === 'asc';
    return collection.sort((a, b) => {
        return compareValues(a, b, orderRule, isAsc);
    });
}
export function unique(array) {
    return Array.from(new Set(array));
}
export function uniqueByField(array, field) {
    return [...new Map(array.map((item) => [item[field], item])).values()];
}
export function compact(array) {
    return array.filter(Boolean);
}
export function areSortedArraysEqual(array1, array2) {
    if (array1.length !== array2.length) {
        return false;
    }
    return array1.every((item, i) => item === array2[i]);
}
export function areSortedArraysIntersecting(array1, array2) {
    return array1[0] <= array2[array2.length - 1] && array1[array1.length - 1] >= array2[0];
}
export function isInsideSortedArrayRange(value, array) {
    return array[0] <= value && value <= array[array.length - 1];
}
export function findIntersectionWithSet(array, set) {
    return array.filter((a) => set.has(a));
}
/**
 * Exlude elements from base array. Both arrays should be sorted in same order
 * @param base
 * @param toExclude
 * @returns New array without excluded elements
 */
export function excludeSortedArray(base, toExclude) {
    if (!base?.length)
        return base;
    const result = [];
    let excludeIndex = 0;
    for (let i = 0; i < base.length; i++) {
        if (toExclude[excludeIndex] === base[i]) {
            excludeIndex += 1;
        }
        else {
            result.push(base[i]);
        }
    }
    return result;
}
export function split(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}
export function partition(array, filter) {
    const pass = [];
    const fail = [];
    array.forEach((e, idx, arr) => (filter(e, idx, arr) ? pass : fail).push(e));
    return [pass, fail];
}
export function cloneDeep(value) {
    if (!isObject(value)) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(cloneDeep);
    }
    return Object.keys(value).reduce((acc, key) => {
        acc[key] = cloneDeep(value[key]);
        return acc;
    }, {});
}
export function isLiteralObject(value) {
    return isObject(value) && !Array.isArray(value);
}
function isObject(value) {
    // eslint-disable-next-line no-null/no-null
    return typeof value === 'object' && value !== null;
}
export function findLast(array, predicate) {
    let cursor = array.length;
    while (cursor--) {
        if (predicate(array[cursor], cursor, array)) {
            return array[cursor];
        }
    }
    return undefined;
}
export function compareFields(a, b) {
    return Number(b) - Number(a);
}
