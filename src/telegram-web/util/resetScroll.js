import { IS_IOS } from './browser/windowEnvironment';
import forceReflow from './forceReflow';
const resetScroll = (container, scrollTop) => {
    if (IS_IOS) {
        container.style.overflow = 'hidden';
    }
    if (scrollTop !== undefined) {
        container.scrollTop = scrollTop;
    }
    if (IS_IOS) {
        container.style.overflow = '';
    }
};
export function stopScrollInertia(element) {
    element.style.display = 'none';
    forceReflow(element);
    element.style.display = '';
}
export default resetScroll;
