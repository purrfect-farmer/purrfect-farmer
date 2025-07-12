import { updateFullLocalDb } from '../localDb';
import { init as initUpdateEmitter } from '../updates/apiUpdateEmitter';
import { init as initClient } from './client';
import * as methods from './index';
export function initApi(_onUpdate, initialArgs, initialLocalDb) {
    initUpdateEmitter(_onUpdate);
    if (initialLocalDb)
        updateFullLocalDb(initialLocalDb);
    // IMPORTANT: Do not await this, or login will not work
    initClient(initialArgs);
}
export function callApi(fnName, ...args) {
    // @ts-ignore
    return methods[fnName](...args);
}
export function cancelApiProgress(progressCallback) {
    progressCallback.isCanceled = true;
}
