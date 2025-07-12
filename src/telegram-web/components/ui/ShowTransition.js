import { useRef } from '../../lib/teact/teact';
import usePreviousDeprecated from '../../hooks/usePreviousDeprecated';
import useShowTransition from '../../hooks/useShowTransition';
const ShowTransition = ({ isOpen, isHidden, isCustom, id, className, onClick, children, noCloseTransition, shouldAnimateFirstRender, style, ref: externalRef, }) => {
    const prevIsOpen = usePreviousDeprecated(isOpen);
    const prevChildren = usePreviousDeprecated(children);
    const fromChildrenRef = useRef();
    const isFirstRender = prevIsOpen === undefined;
    const { ref, shouldRender } = useShowTransition({
        isOpen: isOpen && !isHidden,
        ref: externalRef,
        noMountTransition: isFirstRender && !shouldAnimateFirstRender,
        className: isCustom ? false : undefined,
        noCloseTransition,
        withShouldRender: true,
    });
    if (prevIsOpen && !isOpen) {
        fromChildrenRef.current = prevChildren;
    }
    return ((shouldRender || isHidden) && (<div id={id} ref={ref} className={className} onClick={onClick} style={style}>
        {isOpen ? children : fromChildrenRef.current}
      </div>));
};
export default ShowTransition;
