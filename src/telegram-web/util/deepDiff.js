import { isLiteralObject, unique } from './iteratees';
const EQUAL = Symbol('EQUAL');
const DELETE = { __delete: true };
const DELETE_ALL_CHILDREN = { __deleteAllChildren: true };
export function deepDiff(value1, value2) {
    if (value1 === value2) {
        return EQUAL;
    }
    const type1 = typeof value1;
    const type2 = typeof value2;
    if (type1 !== type2) {
        return value2;
    }
    if (Array.isArray(value1) && Array.isArray(value2) && areSortedArraysDeepEqual(value1, value2)) {
        return EQUAL;
    }
    if (!isLiteralObject(value1) || !isLiteralObject(value2)) {
        return value2;
    }
    const object1 = value1;
    const object2 = value2;
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (!keys2.length) {
        return !keys1.length ? EQUAL : DELETE_ALL_CHILDREN;
    }
    const allKeys = unique(keys1.concat(keys2));
    const diff = allKeys.reduce((acc, key) => {
        const subValue1 = object1[key];
        const subValue2 = object2[key];
        if (!object2.hasOwnProperty(key)) {
            acc[key] = DELETE;
            return acc;
        }
        if (!object1.hasOwnProperty(key)) {
            acc[key] = subValue2;
            return acc;
        }
        const subDiff = deepDiff(subValue1, subValue2);
        if (subDiff !== EQUAL) {
            acc[key] = subDiff;
        }
        return acc;
    }, {});
    if (Object.keys(diff).length === 0) {
        return EQUAL;
    }
    return diff;
}
function areSortedArraysDeepEqual(array1, array2) {
    if (array1.length !== array2.length) {
        return false;
    }
    return array1.every((item, i) => deepDiff(item, array2[i]) === EQUAL);
}
