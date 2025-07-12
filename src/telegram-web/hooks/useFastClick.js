import { IS_TOUCH_ENV, MouseButton } from '../util/browser/windowEnvironment';
import useLastCallback from './useLastCallback';
export function useFastClick(callback) {
    const handler = useLastCallback((e) => {
        if (e.type === 'mousedown' && e.button !== MouseButton.Main) {
            return;
        }
        callback(e);
    });
    return IS_TOUCH_ENV
        ? { handleClick: callback ? handler : undefined }
        : { handleMouseDown: callback ? handler : undefined };
}
