import { useEffect, useState } from '../lib/teact/teact';
import { addExtraClass, removeExtraClass } from '../lib/teact/teact-dom';
import { requestMutation } from '../lib/fasterdom/fasterdom';
import { IS_IOS, IS_PWA, IS_TOUCH_ENV } from '../util/browser/windowEnvironment';
import useLastCallback from './useLastCallback';
const LONG_TAP_DURATION_MS = 200;
const IOS_PWA_CONTEXT_MENU_DELAY_MS = 100;
function stopEvent(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    e.stopPropagation();
}
const useContextMenuHandlers = (elementRef, isMenuDisabled, shouldDisableOnLink, shouldDisableOnLongTap, getIsReady, shouldDisablePropagation) => {
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [contextMenuAnchor, setContextMenuAnchor] = useState(undefined);
    const [contextMenuTarget, setContextMenuTarget] = useState(undefined);
    const handleBeforeContextMenu = useLastCallback((e) => {
        if (!isMenuDisabled && e.button === 2) {
            requestMutation(() => {
                addExtraClass(e.target, 'no-selection');
            });
        }
    });
    const handleContextMenu = useLastCallback((e) => {
        requestMutation(() => {
            removeExtraClass(e.target, 'no-selection');
        });
        if (isMenuDisabled || (shouldDisableOnLink && e.target.matches('a[href]'))) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (contextMenuAnchor) {
            return;
        }
        setIsContextMenuOpen(true);
        setContextMenuAnchor({ x: e.clientX, y: e.clientY });
        setContextMenuTarget(e.target);
    });
    const handleContextMenuClose = useLastCallback(() => {
        setIsContextMenuOpen(false);
    });
    const handleContextMenuHide = useLastCallback(() => {
        setContextMenuAnchor(undefined);
    });
    // Support context menu on touch devices
    useEffect(() => {
        if (isMenuDisabled || !IS_TOUCH_ENV || shouldDisableOnLongTap || (getIsReady && !getIsReady())) {
            return undefined;
        }
        const element = elementRef.current;
        if (!element) {
            return undefined;
        }
        let timer;
        const clearLongPressTimer = () => {
            if (timer) {
                clearTimeout(timer);
                timer = undefined;
            }
        };
        const emulateContextMenuEvent = (originalEvent) => {
            clearLongPressTimer();
            const { clientX, clientY, target } = originalEvent.touches[0];
            if (contextMenuAnchor || (shouldDisableOnLink && target.matches('a[href]'))) {
                return;
            }
            // Temporarily intercept and clear the next click
            document.addEventListener('touchend', (e) => {
                // On iOS in PWA mode, the context menu may cause click-through to the element in the menu upon opening
                if (IS_IOS && IS_PWA) {
                    setTimeout(() => {
                        document.removeEventListener('mousedown', stopEvent, {
                            capture: true,
                        });
                        document.removeEventListener('click', stopEvent, {
                            capture: true,
                        });
                    }, IOS_PWA_CONTEXT_MENU_DELAY_MS);
                }
                stopEvent(e);
            }, {
                once: true,
                capture: true,
            });
            // On iOS15, in PWA mode, the context menu immediately closes after opening
            if (IS_PWA && IS_IOS) {
                document.addEventListener('mousedown', stopEvent, {
                    once: true,
                    capture: true,
                });
                document.addEventListener('click', stopEvent, {
                    once: true,
                    capture: true,
                });
            }
            setIsContextMenuOpen(true);
            setContextMenuAnchor({ x: clientX, y: clientY });
        };
        const startLongPressTimer = (e) => {
            if (isMenuDisabled) {
                return;
            }
            if (shouldDisablePropagation)
                e.stopPropagation();
            clearLongPressTimer();
            timer = window.setTimeout(() => emulateContextMenuEvent(e), LONG_TAP_DURATION_MS);
        };
        // @perf Consider event delegation
        element.addEventListener('touchstart', startLongPressTimer, { passive: true });
        element.addEventListener('touchcancel', clearLongPressTimer, true);
        element.addEventListener('touchend', clearLongPressTimer, true);
        element.addEventListener('touchmove', clearLongPressTimer, { passive: true });
        return () => {
            clearLongPressTimer();
            element.removeEventListener('touchstart', startLongPressTimer);
            element.removeEventListener('touchcancel', clearLongPressTimer, true);
            element.removeEventListener('touchend', clearLongPressTimer, true);
            element.removeEventListener('touchmove', clearLongPressTimer);
        };
    }, [
        contextMenuAnchor, isMenuDisabled, shouldDisableOnLongTap, elementRef, shouldDisableOnLink, getIsReady,
        shouldDisablePropagation,
    ]);
    return {
        isContextMenuOpen,
        contextMenuAnchor,
        contextMenuTarget,
        handleBeforeContextMenu,
        handleContextMenu,
        handleContextMenuClose,
        handleContextMenuHide,
    };
};
export default useContextMenuHandlers;
