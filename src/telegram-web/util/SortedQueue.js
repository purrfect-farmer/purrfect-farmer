export default class SortedQueue {
    comparator;
    queue;
    constructor(comparator) {
        this.comparator = comparator;
        this.queue = [];
    }
    add(item) {
        const index = this.binarySearch(item);
        this.queue.splice(index, 0, item);
    }
    pop() {
        return this.queue.shift();
    }
    get size() {
        return this.queue.length;
    }
    clear() {
        this.queue = [];
    }
    binarySearch(item) {
        let left = 0;
        let right = this.queue.length;
        while (left < right) {
            const middle = Math.floor((left + right) / 2);
            const comparison = this.comparator(item, this.queue[middle]);
            if (comparison === 0) {
                return middle;
            }
            else if (comparison > 0) {
                left = middle + 1;
            }
            else {
                right = middle;
            }
        }
        return left;
    }
}
