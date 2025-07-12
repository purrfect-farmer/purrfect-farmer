import { API_THROTTLE_RESET_UPDATES, API_UPDATE_THROTTLE } from '../../../config';
import { throttle, throttleWithTickEnd } from '../../../util/schedulers';
let onUpdate;
export function init(_onUpdate) {
    onUpdate = _onUpdate;
}
export function sendApiUpdate(update) {
    queueUpdate(update);
}
export function sendImmediateApiUpdate(update) {
    onUpdate(update);
}
const flushUpdatesOnTickEnd = throttleWithTickEnd(flushUpdates);
let flushUpdatesThrottled;
let currentThrottleId;
let pendingUpdates;
function queueUpdate(update) {
    if (!pendingUpdates) {
        pendingUpdates = [update];
    }
    else {
        pendingUpdates.push(update);
    }
    if (!flushUpdatesThrottled || API_THROTTLE_RESET_UPDATES.has(update['@type'])) {
        flushUpdatesThrottled = throttle(flushUpdatesOnTickEnd, API_UPDATE_THROTTLE, true);
        currentThrottleId = Math.random();
    }
    flushUpdatesThrottled(currentThrottleId);
}
function flushUpdates(throttleId) {
    if (!pendingUpdates || throttleId !== currentThrottleId) {
        return;
    }
    const currentUpdates = pendingUpdates;
    pendingUpdates = undefined;
    currentUpdates.forEach(onUpdate);
}
