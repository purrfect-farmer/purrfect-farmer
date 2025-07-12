import { deepFreeze } from '../../util/data/freeze';
import { deepDiff } from '../../util/deepDiff';
import { deepMerge } from '../../util/deepMerge';
let state;
const ports = [];
self.onconnect = (e) => {
    const port = e.ports[0];
    ports.push(port);
    port.start();
    port.onmessage = (event) => {
        const data = event.data;
        switch (data.type) {
            case 'reqGetFullState': {
                const localState = data.localState;
                if (!state) {
                    // First tab to load, use this state as the source of truth.
                    state = localState;
                }
                sendToClient(port, { type: 'fullState', state });
                break;
            }
            case 'reqUpdateState': {
                if (!state)
                    return; // Client should request full state first
                const prevState = state;
                state = deepMerge(state, data.update);
                state.isInitial = undefined; // Remove the flag
                const diff = deepDiff(prevState, state);
                if (typeof diff !== 'symbol') {
                    broadcast({ type: 'stateUpdate', update: diff }, port);
                }
                break;
            }
        }
    };
};
function sendToClient(port, message) {
    port.postMessage(message);
}
function broadcast(message, ignorePort) {
    // Iterate backwards to safely remove ports if needed.
    for (let i = ports.length - 1; i >= 0; i--) {
        if (ports[i] === ignorePort) { // Prevent infinite loopback
            continue;
        }
        try {
            sendToClient(ports[i], message);
        }
        catch (e) {
            ports.splice(i, 1);
        }
    }
}
// DEBUG
self.getState = () => deepFreeze(state);
