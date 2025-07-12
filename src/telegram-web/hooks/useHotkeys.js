import { useEffect } from '../lib/teact/teact';
import { createCallbackManager } from '../util/callbacks';
import { getHotkeyMatcher } from '../util/parseHotkey';
const IGNORE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const handlers = createCallbackManager();
document.documentElement.addEventListener('keydown', handlers.runCallbacks);
export function useHotkeys(hotkeys) {
    useEffect(() => {
        if (!hotkeys) {
            return undefined;
        }
        const entries = Object.entries(hotkeys);
        function handleKeyDown(e) {
            if (!shouldFireEvent(e)) {
                return;
            }
            entries.forEach(([hotkey, handler]) => {
                if (getHotkeyMatcher(hotkey)(e)) {
                    handler(e);
                }
            });
        }
        return handlers.addCallback(handleKeyDown);
    }, [hotkeys]);
}
function shouldFireEvent(e) {
    if (e.target instanceof HTMLElement) {
        return !IGNORE_TAGS.has(e.target.tagName);
    }
    return true;
}
