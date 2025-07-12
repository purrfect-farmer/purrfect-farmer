export default class Deferred {
    promise;
    reject;
    resolve;
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.reject = reject;
            this.resolve = resolve;
        });
    }
    static resolved(value) {
        const deferred = new Deferred();
        deferred.resolve(value);
        return deferred;
    }
}
