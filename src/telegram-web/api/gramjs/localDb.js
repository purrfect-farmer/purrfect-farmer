import BigInt from 'big-integer';
import { Api as GramJs } from '../../lib/gramjs';
import { DEBUG } from '../../config';
import { DATA_BROADCAST_CHANNEL_NAME } from '../../util/multiaccount';
import { throttle } from '../../util/schedulers';
import { omitVirtualClassFields } from './apiBuilders/helpers';
const channel = new BroadcastChannel(DATA_BROADCAST_CHANNEL_NAME);
let batchedUpdates = [];
const throttledLocalDbUpdate = throttle(() => {
    channel.postMessage({
        type: 'localDbUpdate',
        batchedUpdates,
    });
    batchedUpdates = [];
}, 100);
function createProxy(name, object) {
    return new Proxy(object, {
        get(target, prop, value) {
            return Reflect.get(target, prop, value);
        },
        set(target, prop, value) {
            batchedUpdates.push({ name, prop, value });
            throttledLocalDbUpdate();
            return Reflect.set(target, prop, value);
        },
    });
}
function convertToVirtualClass(value) {
    if (value instanceof Uint8Array)
        return Buffer.from(value);
    if (typeof value === 'object' && Object.keys(value).length === 1 && Object.keys(value)[0] === 'value') {
        return BigInt(value.value);
    }
    if (Array.isArray(value)) {
        return value.map(convertToVirtualClass);
    }
    if (typeof value !== 'object' || !('CONSTRUCTOR_ID' in value)) {
        return value;
    }
    const path = value.className.split('.');
    const VirtualClass = path.reduce((acc, field) => {
        return acc[field];
    }, GramJs);
    const valueOmited = omitVirtualClassFields(value);
    const valueConverted = Object.keys(valueOmited).reduce((acc, key) => {
        acc[key] = convertToVirtualClass(valueOmited[key]);
        return acc;
    }, {});
    return new VirtualClass(valueConverted);
}
function createLocalDbInitial(initial) {
    return [
        'localMessages', 'chats', 'users', 'messages', 'documents', 'stickerSets', 'photos', 'webDocuments', 'stories',
        'commonBoxState', 'channelPtsById',
    ]
        .reduce((acc, key) => {
        const value = initial?.[key] ?? {};
        const convertedValue = Object.keys(value).reduce((acc2, key2) => {
            if (key === 'commonBoxState' || key === 'channelPtsById') {
                const typedValue = value;
                acc2[key2] = typedValue[key2];
                return acc2;
            }
            acc2[key2] = convertToVirtualClass(value[key2]);
            return acc2;
        }, {});
        acc[key] = createProxy(key, convertedValue);
        return acc;
    }, {});
}
const localDb = createLocalDbInitial();
export default localDb;
export function broadcastLocalDbUpdateFull() {
    if (!channel)
        return;
    channel.postMessage({
        type: 'localDbUpdateFull',
        localDb: Object.keys(localDb).reduce((acc, key) => {
            acc[key] = { ...localDb[key] };
            return acc;
        }, {}),
    });
}
export function updateFullLocalDb(initial) {
    Object.assign(localDb, createLocalDbInitial(initial));
}
export function clearLocalDb() {
    Object.assign(localDb, createLocalDbInitial());
}
if (DEBUG) {
    globalThis.getLocalDb = () => localDb;
}
