let scrollLockEl;
let excludedClosestSelector;
const IGNORED_KEYS = {
    Down: true,
    ArrowDown: true,
    Up: true,
    ArrowUp: true,
    Left: true,
    ArrowLeft: true,
    Right: true,
    ArrowRight: true,
    ' ': true,
    PageUp: true,
    PageDown: true,
    End: true,
    Home: true,
    Tab: true,
};
function isTextBox(target) {
    if (!target || !(target instanceof HTMLElement))
        return false;
    const element = target;
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'textarea')
        return true;
    if (tagName !== 'input')
        return false;
    const type = element.getAttribute('type');
    if (!type)
        return false;
    const inputTypes = [
        'text', 'password', 'number', 'email', 'tel', 'url',
        'search', 'date', 'datetime', 'datetime-local', 'time', 'month', 'week',
    ];
    return inputTypes.indexOf(type.toLowerCase()) > -1;
}
export const getTouchY = (e) => {
    return ('changedTouches' in e ? e.changedTouches[0].clientY : 0);
};
const preventDefault = (e) => {
    const deltaY = 'deltaY' in e ? e.deltaY : getTouchY(e);
    if (!scrollLockEl
        // Allow overlay scrolling
        || !scrollLockEl.contains(e.target)
        // Prevent top overscroll
        || (scrollLockEl.scrollTop <= 0 && deltaY <= 0)
        // Prevent bottom overscroll
        || (scrollLockEl.scrollTop >= (scrollLockEl.scrollHeight - scrollLockEl.offsetHeight) && deltaY >= 0)) {
        if (excludedClosestSelector && e.target.closest(excludedClosestSelector))
            return;
        e.preventDefault();
    }
};
function preventDefaultForScrollKeys(e) {
    if (IGNORED_KEYS[e.key] && !isTextBox(e.target)) {
        e.preventDefault();
    }
}
export function disableScrolling(el, _excludedClosestSelector) {
    scrollLockEl = el;
    excludedClosestSelector = _excludedClosestSelector;
    // Disable scrolling in Chrome
    document.addEventListener('wheel', preventDefault, { passive: false });
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.onkeydown = preventDefaultForScrollKeys;
    return enableScrolling;
}
export function enableScrolling() {
    scrollLockEl = undefined;
    excludedClosestSelector = undefined;
    document.removeEventListener('wheel', preventDefault); // Enable scrolling in Chrome
    document.removeEventListener('touchmove', preventDefault);
    // eslint-disable-next-line no-null/no-null
    document.onkeydown = null;
}
