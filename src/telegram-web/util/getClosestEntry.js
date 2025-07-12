export function getClosestEntry(arr, value) {
    return arr.reduce((prev, curr) => {
        return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
    });
}
