import { createCallbackManager } from './callbacks';
const SIGNAL_MARK = Symbol('SIGNAL_MARK');
export function isSignal(obj) {
    return typeof obj === 'function' && SIGNAL_MARK in obj;
}
// A shorthand to unsubscribe effect from all signals
const unsubscribesByEffect = new Map();
let currentEffect;
export function createSignal(defaultValue) {
    const state = {
        value: defaultValue,
        effects: createCallbackManager(),
    };
    function subscribe(effect) {
        const unsubscribe = state.effects.addCallback(effect);
        if (!unsubscribesByEffect.has(effect)) {
            unsubscribesByEffect.set(effect, new Set([unsubscribe]));
        }
        else {
            unsubscribesByEffect.get(effect).add(unsubscribe);
        }
        return () => {
            unsubscribe();
            const unsubscribes = unsubscribesByEffect.get(effect);
            unsubscribes.delete(unsubscribe);
            if (!unsubscribes.size) {
                unsubscribesByEffect.delete(effect);
            }
        };
    }
    function once(effect) {
        const unsub = subscribe(() => {
            unsub();
            effect();
        });
        return unsub;
    }
    function getter() {
        if (currentEffect) {
            subscribe(currentEffect);
        }
        return state.value;
    }
    function setter(newValue) {
        if (state.value === newValue) {
            return;
        }
        state.value = newValue;
        state.effects.runCallbacks();
    }
    const signal = Object.assign(getter, {
        [SIGNAL_MARK]: SIGNAL_MARK,
        subscribe,
        once,
    });
    return [signal, setter];
}
export function cleanupEffect(effect) {
    unsubscribesByEffect.get(effect)?.forEach((unsubscribe) => {
        unsubscribe();
    });
    unsubscribesByEffect.delete(effect);
}
