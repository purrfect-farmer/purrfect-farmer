export class ChatAbortController extends AbortController {
    threads = new Map();
    getThreadSignal(threadId) {
        let controller = this.threads.get(threadId);
        if (!controller) {
            controller = new AbortController();
            this.threads.set(threadId, controller);
        }
        return controller.signal;
    }
    abortThread(threadId, reason) {
        this.threads.get(threadId)?.abort(reason);
        this.threads.delete(threadId);
    }
    abort(reason) {
        super.abort(reason);
        this.threads.forEach((controller) => controller.abort(reason));
        this.threads.clear();
    }
}
