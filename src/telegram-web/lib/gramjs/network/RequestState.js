import Deferred from '../../../util/Deferred';
export default class RequestState {
    containerId;
    msgId;
    request;
    data;
    after;
    result;
    finished;
    promise;
    abortSignal;
    resolve;
    reject;
    constructor(request, abortSignal) {
        this.containerId = undefined;
        this.msgId = undefined;
        this.request = request;
        this.data = request.getBytes();
        this.after = undefined;
        this.result = undefined;
        this.abortSignal = abortSignal;
        this.finished = new Deferred();
        this.resetPromise();
    }
    isReady() {
        if (!this.after) {
            return true;
        }
        return this.after.finished.promise;
    }
    resetPromise() {
        // Prevent stuck await
        this.reject?.();
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
