import { onFullyIdle } from '../../lib/teact/teact';
import { addCallback } from '../../lib/teact/teactn';
import { getActions, getGlobal, setGlobal } from '../../global';
import { selectTabState } from '../../global/selectors';
import { callApiLocal, cancelApiProgressMaster, handleMethodCallback, handleMethodResponse, initApi, updateFullLocalDb, updateLocalDb, } from '../../api/gramjs';
import { deepDiff } from '../deepDiff';
import { deepMerge } from '../deepMerge';
import { getCurrentTabId, signalPasscodeHash, subscribeToTokenDied } from '../establishMultitabRole';
import { omit } from '../iteratees';
import { DATA_BROADCAST_CHANNEL_NAME, MULTITAB_STORAGE_KEY } from '../multiaccount';
const MULTITAB_ESTABLISH_TIMEOUT = 800;
let resolveGlobalPromise;
let isFirstGlobalResolved = false;
let currentGlobal;
let isDisabled = false;
const channel = new BroadcastChannel(DATA_BROADCAST_CHANNEL_NAME);
let isBroadcastDiffScheduled = false;
let lastBroadcastDiffGlobal;
function broadcastDiffOnIdle() {
    if (isBroadcastDiffScheduled)
        return;
    isBroadcastDiffScheduled = true;
    lastBroadcastDiffGlobal = currentGlobal;
    onFullyIdle(() => {
        const diff = deepDiff(lastBroadcastDiffGlobal, currentGlobal);
        if (typeof diff !== 'symbol') {
            channel.postMessage({
                type: 'globalDiffUpdate',
                diff,
            });
        }
        isBroadcastDiffScheduled = false;
    });
}
export function unsubcribeFromMultitabBroadcastChannel() {
    channel.removeEventListener('message', handleMessage);
    isDisabled = true;
}
export function subscribeToMultitabBroadcastChannel() {
    subscribeToTokenDied((token) => {
        if (token === getCurrentTabId()) {
            unsubcribeFromMultitabBroadcastChannel();
            const global = getGlobal();
            const newGlobal = {
                ...global,
                byTabId: omit(global.byTabId, [token]),
            };
            const diff = deepDiff(global, newGlobal);
            if (typeof diff !== 'symbol') {
                channel.postMessage({
                    type: 'globalDiffUpdate',
                    diff,
                });
            }
            return;
        }
        let global = getGlobal();
        global = {
            ...global,
            byTabId: omit(global.byTabId, [token]),
        };
        setGlobal(global);
    });
    addCallback((global) => {
        if (!isFirstGlobalResolved || isDisabled) {
            currentGlobal = global;
            return;
        }
        if (currentGlobal === global) {
            return;
        }
        if (!currentGlobal) {
            currentGlobal = global;
            channel.postMessage({
                type: 'globalUpdate',
                global,
            });
            return;
        }
        broadcastDiffOnIdle();
        currentGlobal = global;
    });
    channel.addEventListener('message', handleMessage);
}
export function handleMessage({ data }) {
    if (!data)
        return;
    switch (data.type) {
        case 'initApi': {
            const global = getGlobal();
            if (!selectTabState(global).isMasterTab)
                return;
            const { initialArgs } = data;
            initApi(getActions().apiUpdate, initialArgs);
            break;
        }
        case 'globalDiffUpdate': {
            if (!isFirstGlobalResolved)
                return;
            const { diff } = data;
            const oldGlobal = getGlobal();
            const global = deepMerge(oldGlobal, diff);
            // @ts-ignore
            global.DEBUG_randomId = oldGlobal.DEBUG_randomId;
            currentGlobal = global;
            setGlobal(global);
            break;
        }
        case 'globalUpdate': {
            if (isFirstGlobalResolved)
                return;
            const oldGlobal = getGlobal();
            // @ts-ignore
            data.global.DEBUG_randomId = oldGlobal.DEBUG_randomId;
            currentGlobal = data.global;
            // eslint-disable-next-line tt-multitab/set-global-only-variable
            setGlobal(data.global);
            if (resolveGlobalPromise) {
                resolveGlobalPromise();
                resolveGlobalPromise = undefined;
                isFirstGlobalResolved = true;
            }
            break;
        }
        case 'requestGlobal': {
            const { appVersion } = data;
            if (appVersion !== APP_VERSION) {
                // If app version on the other tab was updated, reload the current page immediately and don't respond
                // to the other tab's request because our current global might be incompatible with the new version
                window.location.reload();
                return;
            }
            if (!isFirstGlobalResolved)
                return;
            const global = getGlobal();
            if (!selectTabState(global).isMasterTab)
                return;
            channel.postMessage({
                type: 'globalUpdate',
                global,
            });
            signalPasscodeHash();
            break;
        }
        case 'messageCallback': {
            if (!isFirstGlobalResolved)
                return;
            const global = getGlobal();
            if (selectTabState(global).isMasterTab)
                return;
            handleMethodCallback(data);
            break;
        }
        case 'localDbUpdate': {
            if (!isFirstGlobalResolved)
                return;
            const global = getGlobal();
            if (selectTabState(global).isMasterTab)
                return;
            const { batchedUpdates, } = data;
            batchedUpdates.forEach(({ name, prop, value, }) => {
                updateLocalDb(name, prop, value);
            });
            break;
        }
        case 'localDbUpdateFull': {
            if (!isFirstGlobalResolved)
                return;
            const global = getGlobal();
            if (selectTabState(global).isMasterTab)
                return;
            const { localDb } = data;
            updateFullLocalDb(localDb);
            break;
        }
        case 'messageResponse': {
            if (!isFirstGlobalResolved)
                return;
            const global = getGlobal();
            if (selectTabState(global).isMasterTab)
                return;
            handleMethodResponse(data);
            break;
        }
        case 'cancelApiProgress': {
            if (!isFirstGlobalResolved)
                return;
            const global = getGlobal();
            if (!selectTabState(global).isMasterTab)
                return;
            const { messageId } = data;
            cancelApiProgressMaster(messageId);
            break;
        }
        case 'callApi': {
            if (!isFirstGlobalResolved)
                return;
            const global = getGlobal();
            if (!selectTabState(global).isMasterTab)
                return;
            const { name, messageId, token, args, withCallback, } = data;
            const argsWithCallback = (withCallback ? [...args, (...callbackArgs) => {
                    channel.postMessage({
                        type: 'messageCallback',
                        token,
                        messageId,
                        callbackArgs,
                    });
                }] : args);
            (async () => {
                const result = await (callApiLocal(name, ...argsWithCallback));
                channel.postMessage({
                    type: 'messageResponse',
                    token,
                    messageId,
                    response: result,
                });
            })();
            break;
        }
        case 'langpackRefresh': {
            getActions().refreshLangPackFromCache({ langCode: data.langCode });
            break;
        }
    }
}
export function requestGlobal(appVersion) {
    channel.postMessage({
        type: 'requestGlobal',
        appVersion,
    });
    const resolveWithoutGlobal = () => {
        if (resolveGlobalPromise) {
            resolveGlobalPromise();
            resolveGlobalPromise = undefined;
        }
        isFirstGlobalResolved = true;
    };
    if (localStorage.getItem(MULTITAB_STORAGE_KEY)) {
        setTimeout(resolveWithoutGlobal, MULTITAB_ESTABLISH_TIMEOUT);
    }
    else {
        resolveWithoutGlobal();
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        resolveGlobalPromise = resolve;
    });
}
export function notifyLangpackUpdate(langCode) {
    channel.postMessage({
        type: 'langpackRefresh',
        langCode,
    });
}
