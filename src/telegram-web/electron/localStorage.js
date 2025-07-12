import { checkIsWebContentsUrlAllowed, getLastWindow } from './utils';
let localStorage;
export async function captureLocalStorage() {
    const lastWindow = getLastWindow();
    if (!lastWindow) {
        return;
    }
    const contents = lastWindow.webContents;
    const contentsUrl = contents.getURL();
    if (!checkIsWebContentsUrlAllowed(contentsUrl)) {
        return;
    }
    localStorage = await contents.executeJavaScript('({ ...localStorage });');
}
export async function restoreLocalStorage() {
    const lastWindow = getLastWindow();
    if (!lastWindow || !localStorage) {
        return;
    }
    const contents = lastWindow.webContents;
    const contentsUrl = contents.getURL();
    if (!checkIsWebContentsUrlAllowed(contentsUrl)) {
        return;
    }
    await contents.executeJavaScript(Object.keys(localStorage).map((key) => `localStorage.setItem('${key}', JSON.stringify(${localStorage[key]}))`).join(';'));
    localStorage = undefined;
}
