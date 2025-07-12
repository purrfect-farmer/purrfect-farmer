import { addCallback } from '../../lib/teact/teactn';
import { getGlobal } from '../../global';
import { createSignal } from '../../util/signals';
import useSyncEffect from '../useSyncEffect';
const bySelector = new Map();
addCallback((global) => {
    for (const [selector, { setter }] of bySelector) {
        setter(selector(global));
    }
});
function useSelectorSignal(selector) {
    let state = bySelector.get(selector);
    if (!state) {
        const [getter, setter] = createSignal(selector(getGlobal()));
        state = { clientsCount: 0, getter, setter };
        bySelector.set(selector, state);
    }
    useSyncEffect(() => {
        const state2 = bySelector.get(selector);
        state2.clientsCount++;
        return () => {
            state2.clientsCount--;
            if (!state2.clientsCount) {
                bySelector.delete(selector);
            }
        };
    }, [selector]);
    return state.getter;
}
export default useSelectorSignal;
