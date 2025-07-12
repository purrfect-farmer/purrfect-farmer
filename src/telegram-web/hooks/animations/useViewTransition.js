import { useEffect, useRef, useState, } from '../../lib/teact/teact';
import { VIEW_TRANSITION_CLASS_NAME } from '../../config';
import { requestMutation, requestNextMutation } from '../../lib/fasterdom/fasterdom';
import { IS_VIEW_TRANSITION_SUPPORTED } from '../../util/browser/windowEnvironment';
import Deferred from '../../util/Deferred';
let hasActiveTransition = false;
export function hasActiveViewTransition() {
    return hasActiveTransition;
}
export function useViewTransition() {
    const domUpdaterFn = useRef();
    const [transitionState, setTransitionState] = useState('idle');
    useEffect(() => {
        if (transitionState !== 'capturing-old')
            return;
        const transition = document.startViewTransition(async () => {
            setTransitionState('capturing-new');
            if (domUpdaterFn.current)
                await domUpdaterFn.current();
            const deferred = new Deferred();
            requestNextMutation(() => {
                deferred.resolve();
            });
            return deferred.promise;
        });
        transition.finished.then(() => {
            setTransitionState('idle');
            requestMutation(() => {
                document.body.classList.remove(VIEW_TRANSITION_CLASS_NAME);
            });
            hasActiveTransition = false;
        });
        transition.ready.then(() => {
            setTransitionState('animating');
        }).catch((e) => {
            // eslint-disable-next-line no-console
            console.error(e);
            setTransitionState('skipped');
            requestMutation(() => {
                document.body.classList.remove(VIEW_TRANSITION_CLASS_NAME);
            });
            hasActiveTransition = false;
        });
    }, [transitionState]);
    function startViewTransition(updateCallback) {
        // Fallback: simply run the callback immediately if view transitions aren't supported.
        if (!IS_VIEW_TRANSITION_SUPPORTED) {
            if (updateCallback)
                updateCallback();
            return;
        }
        domUpdaterFn.current = updateCallback;
        setTransitionState('capturing-old');
        requestMutation(() => {
            document.body.classList.add(VIEW_TRANSITION_CLASS_NAME);
        });
        hasActiveTransition = true;
    }
    return {
        shouldApplyVtn: transitionState === 'capturing-old'
            || transitionState === 'capturing-new' || transitionState === 'animating',
        transitionState,
        startViewTransition,
    };
}
