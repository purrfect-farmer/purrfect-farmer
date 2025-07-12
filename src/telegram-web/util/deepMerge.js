import { isLiteralObject, unique } from './iteratees';
export function deepMerge(value1, value2) {
    if (value1 === value2) {
        return value2;
    }
    if (!isLiteralObject(value2)) {
        return value2;
    }
    if (!isLiteralObject(value1)) {
        return reduceDiff(value2);
    }
    if ('__deleteAllChildren' in value2) {
        return {};
    }
    const allKeys = unique(Object.keys(value1).concat(Object.keys(value2)));
    return allKeys.reduce((acc, key) => {
        const oldValue = value1[key];
        if (!value2.hasOwnProperty(key)) {
            acc[key] = oldValue;
        }
        else {
            const newValue = value2[key];
            if (!newValue?.__delete) {
                acc[key] = deepMerge(oldValue, newValue);
            }
        }
        return acc;
    }, {});
}
function reduceDiff(diff) {
    if (diff.__deleteAllChildren) {
        return {};
    }
    return Object.entries(diff).reduce((acc, [key, value]) => {
        if (!value?.__delete) {
            acc[key] = isLiteralObject(value) ? reduceDiff(value) : value;
        }
        return acc;
    }, {});
}
