import { DEBUG } from '../config';
import { createCallbackManager } from './callbacks';
import { throttleWithTickEnd } from './schedulers';
const callbackState = new Map();
const messageHandlers = createCallbackManager();
onmessage = messageHandlers.runCallbacks;
export function createWorkerInterface(api, channel) {
    let pendingPayloads = [];
    let pendingTransferables = [];
    const sendToOriginOnTickEnd = throttleWithTickEnd(() => {
        const data = { channel, payloads: pendingPayloads };
        const transferables = pendingTransferables;
        pendingPayloads = [];
        pendingTransferables = [];
        if (transferables.length) {
            postMessage(data, transferables);
        }
        else {
            postMessage(data);
        }
    });
    function sendToOrigin(payload, transferables) {
        pendingPayloads.push(payload);
        if (transferables) {
            pendingTransferables.push(...transferables);
        }
        sendToOriginOnTickEnd();
    }
    handleErrors(sendToOrigin);
    messageHandlers.addCallback((message) => {
        if (message.data?.channel === channel) {
            onMessage(api, message.data, sendToOrigin);
        }
    });
}
function onMessage(api, data, sendToOrigin, onUpdate) {
    if (!onUpdate) {
        onUpdate = (update) => {
            sendToOrigin({
                type: 'update',
                update,
            });
        };
    }
    data.payloads.forEach(async (payload) => {
        switch (payload.type) {
            case 'init': {
                const { args } = payload;
                if (typeof api === 'function') {
                    await api('init', onUpdate, ...args);
                }
                else {
                    await api.init?.(onUpdate, ...args);
                }
                break;
            }
            case 'callMethod': {
                const { messageId, name, args, withCallback, } = payload;
                try {
                    if (typeof api !== 'function' && !api[name])
                        return;
                    if (messageId && withCallback) {
                        const callback = (...callbackArgs) => {
                            const lastArg = callbackArgs[callbackArgs.length - 1];
                            sendToOrigin({
                                type: 'methodCallback',
                                messageId,
                                callbackArgs,
                            }, isTransferable(lastArg) ? [lastArg] : undefined);
                        };
                        callbackState.set(messageId, callback);
                        args.push(callback);
                    }
                    const response = typeof api === 'function'
                        ? await api(name, ...args)
                        : await api[name](...args);
                    const { arrayBuffer } = (typeof response === 'object' && 'arrayBuffer' in response && response) || {};
                    if (messageId) {
                        sendToOrigin({
                            type: 'methodResponse',
                            messageId,
                            response,
                        }, arrayBuffer ? [arrayBuffer] : undefined);
                    }
                }
                catch (error) {
                    if (DEBUG) {
                        // eslint-disable-next-line no-console
                        console.error(error);
                    }
                    if (messageId) {
                        sendToOrigin({
                            type: 'methodResponse',
                            messageId,
                            error: { message: error.message },
                        });
                    }
                }
                if (messageId) {
                    callbackState.delete(messageId);
                }
                break;
            }
            case 'cancelProgress': {
                const callback = callbackState.get(payload.messageId);
                if (callback) {
                    callback.isCanceled = true;
                }
                break;
            }
        }
    });
}
function isTransferable(obj) {
    return obj instanceof ArrayBuffer || obj instanceof ImageBitmap;
}
function handleErrors(sendToOrigin) {
    self.onerror = (e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        sendToOrigin({ type: 'unhandledError', error: { message: e.error.message || 'Uncaught exception in worker' } });
    };
    self.addEventListener('unhandledrejection', (e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        sendToOrigin({ type: 'unhandledError', error: { message: e.reason.message || 'Uncaught rejection in worker' } });
    });
}
