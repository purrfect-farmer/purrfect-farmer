import captureKeyboardListener from './captureKeyboardListeners';
export default function captureEscKeyListener(handler) {
    return captureKeyboardListener({ onEsc: handler });
}
