const keyToHandlerName = {
    Enter: 'onEnter',
    Backspace: 'onBackspace',
    Delete: 'onDelete',
    Esc: 'onEsc',
    Escape: 'onEsc',
    ArrowUp: 'onUp',
    ArrowDown: 'onDown',
    ArrowLeft: 'onLeft',
    ArrowRight: 'onRight',
    Tab: 'onTab',
};
const handlers = {
    onEnter: [],
    onDelete: [],
    onBackspace: [],
    onEsc: [],
    onUp: [],
    onDown: [],
    onLeft: [],
    onRight: [],
    onTab: [],
};
export default function captureKeyboardListeners(options) {
    if (!hasActiveHandlers()) {
        document.addEventListener('keydown', handleKeyDown, true);
    }
    Object.keys(options).forEach((handlerName) => {
        const handler = options[handlerName];
        if (!handler) {
            return;
        }
        const currentEventHandlers = handlers[handlerName];
        if (currentEventHandlers) {
            currentEventHandlers.push(handler);
        }
    });
    return () => {
        releaseKeyboardListener(options);
    };
}
function hasActiveHandlers() {
    return Object.values(handlers).some((keyHandlers) => Boolean(keyHandlers.length));
}
function handleKeyDown(e) {
    const handlerName = keyToHandlerName[e.key];
    if (!handlerName) {
        return;
    }
    const { length } = handlers[handlerName];
    if (!length) {
        return;
    }
    for (let i = length - 1; i >= 0; i--) {
        const handler = handlers[handlerName][i];
        if (handler(e) !== false) {
            e.stopPropagation();
            break;
        }
    }
}
function releaseKeyboardListener(options) {
    Object.keys(options).forEach((handlerName) => {
        const handler = options[handlerName];
        const currentEventHandlers = handlers[handlerName];
        if (currentEventHandlers) {
            const index = currentEventHandlers.findIndex((cb) => cb === handler);
            if (index !== -1) {
                currentEventHandlers.splice(index, 1);
            }
        }
    });
    if (!hasActiveHandlers()) {
        document.removeEventListener('keydown', handleKeyDown, false);
    }
}
