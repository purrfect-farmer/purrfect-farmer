import generateUniqueId from './generateUniqueId';
import { throttleWithTickEnd } from './schedulers';
class ConnectorClass {
    target;
    onUpdate;
    channel;
    requestStates = new Map();
    requestStatesByCallback = new Map();
    pendingPayloads = [];
    pendingTransferables = [];
    constructor(target, onUpdate, channel) {
        this.target = target;
        this.onUpdate = onUpdate;
        this.channel = channel;
    }
    destroy() {
    }
    init(...args) {
        this.postMessageOnTickEnd({
            type: 'init',
            args,
        });
    }
    request(messageData) {
        const { requestStates, requestStatesByCallback } = this;
        const { transferables, ...restMessageData } = messageData;
        const messageId = generateUniqueId();
        const payload = {
            type: 'callMethod',
            messageId,
            ...restMessageData,
        };
        const requestState = { messageId };
        // Re-wrap type because of `postMessage`
        const promise = new Promise((resolve, reject) => {
            Object.assign(requestState, { resolve, reject });
        });
        if (typeof payload.args[payload.args.length - 1] === 'function') {
            payload.withCallback = true;
            const callback = payload.args.pop();
            requestState.callback = callback;
            requestStatesByCallback.set(callback, requestState);
        }
        requestStates.set(messageId, requestState);
        promise
            .catch(() => undefined)
            .finally(() => {
            requestStates.delete(messageId);
            if (requestState.callback) {
                requestStatesByCallback.delete(requestState.callback);
            }
        });
        this.postMessageOnTickEnd(payload, transferables);
        return promise;
    }
    cancelCallback(progressCallback) {
        progressCallback.isCanceled = true;
        const { messageId } = this.requestStatesByCallback.get(progressCallback) || {};
        if (!messageId) {
            return;
        }
        this.postMessageOnTickEnd({
            type: 'cancelProgress',
            messageId,
        });
    }
    onMessage(data) {
        const { requestStates, channel } = this;
        if (data.channel !== channel) {
            return;
        }
        data.payloads.forEach((payload) => {
            if (payload.type === 'update' && this.onUpdate) {
                this.onUpdate(payload.update);
            }
            if (payload.type === 'methodResponse') {
                const requestState = requestStates.get(payload.messageId);
                if (requestState) {
                    if (payload.error) {
                        requestState.reject(payload.error);
                    }
                    else {
                        requestState.resolve(payload.response);
                    }
                }
            }
            else if (payload.type === 'methodCallback') {
                const requestState = requestStates.get(payload.messageId);
                requestState?.callback?.(...payload.callbackArgs);
            }
            else if (payload.type === 'unhandledError') {
                throw new Error(payload.error?.message);
            }
        });
    }
    postMessageOnTickEnd(payload, transferables) {
        this.pendingPayloads.push(payload);
        if (transferables) {
            this.pendingTransferables.push(...transferables);
        }
        this.postMessagesOnTickEnd();
    }
    postMessagesOnTickEnd = throttleWithTickEnd(() => {
        const { channel } = this;
        const payloads = this.pendingPayloads;
        const transferables = this.pendingTransferables;
        this.pendingPayloads = [];
        this.pendingTransferables = [];
        this.target.postMessage({ channel, payloads }, transferables);
    });
}
export function createConnector(worker, onUpdate, channel) {
    const connector = new ConnectorClass(worker, onUpdate, channel);
    function handleMessage({ data }) {
        connector.onMessage(data);
    }
    worker.addEventListener('message', handleMessage);
    connector.destroy = () => {
        worker.removeEventListener('message', handleMessage);
    };
    return connector;
}
