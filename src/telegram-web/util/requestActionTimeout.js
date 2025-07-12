import { getActions } from '../global';
const callbacks = new Map();
// TODO Pass callbacks to the master tab. Sync them on master change
export default function requestActionTimeout(action, timeout) {
    const name = action.action;
    clearTimeout(callbacks.get(name));
    const timerId = window.setTimeout(() => {
        // @ts-expect-error -- No idea how to properly type this
        getActions()[name](action.payload);
    }, timeout);
    callbacks.set(name, timerId);
}
