import { IS_ANDROID, IS_IOS } from './browser/windowEnvironment';
const SHOULD_PRE_OPEN = IS_IOS || IS_ANDROID;
export default class PopupManager {
    features;
    onFail;
    preOpened;
    constructor(features, onFail) {
        this.features = features;
        this.onFail = onFail;
    }
    preOpenIfNeeded() {
        if (!SHOULD_PRE_OPEN)
            return;
        this.preOpened = window.open('about:blank', undefined, this.features);
        if (this.preOpened) {
            this.preOpened.blur();
        }
        else {
            this.onFail?.();
        }
    }
    open(url) {
        if (this.preOpened) {
            this.preOpened.location.href = url;
            this.preOpened.focus();
            this.preOpened = undefined;
            return;
        }
        if (!SHOULD_PRE_OPEN) {
            const popup = window.open(url, undefined, this.features);
            if (popup) {
                popup.focus();
            }
            else {
                this.onFail?.();
            }
        }
    }
    cancelPreOpen() {
        this.preOpened?.close();
        this.preOpened = undefined;
    }
}
