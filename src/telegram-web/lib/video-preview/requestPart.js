import generateUniqueId from '../../util/generateUniqueId';
import { pause } from '../../util/schedulers';
const PART_TIMEOUT = 30000;
const requestStates = new Map();
export function requestPart(params) {
    const messageId = generateUniqueId();
    const requestState = {};
    let isResolved = false;
    const promise = Promise.race([
        pause(PART_TIMEOUT).then(() => (isResolved ? undefined : Promise.reject(new Error('ERROR_PART_TIMEOUT')))),
        new Promise((resolve, reject) => {
            Object.assign(requestState, { resolve, reject });
        }),
    ]);
    requestStates.set(messageId, requestState);
    promise
        .catch(() => undefined)
        .finally(() => {
        requestStates.delete(messageId);
        isResolved = true;
    });
    const message = {
        type: 'requestPart',
        messageId,
        params,
    };
    postMessage(message);
    return promise;
}
self.addEventListener('message', (e) => {
    const { type, messageId, result } = e.data;
    if (type === 'partResponse') {
        const requestState = requestStates.get(messageId);
        if (requestState) {
            requestState.resolve(result);
        }
    }
});
