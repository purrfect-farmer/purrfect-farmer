import { DEBUG, DEBUG_MORE } from '../../config';
import arePropsShallowEqual, { logUnequalProps } from '../../util/arePropsShallowEqual';
import Deferred from '../../util/Deferred';
import { handleError } from '../../util/handleError';
import { orderBy } from '../../util/iteratees';
import { throttleWithTickEnd } from '../../util/schedulers';
import React, { DEBUG_resolveComponentName, getIsHeavyAnimating, useUnmountCleanup } from './teact';
import useForceUpdate from '../../hooks/useForceUpdate';
import useUniqueId from '../../hooks/useUniqueId';
export default React;
let currentGlobal = {
    isInited: false,
};
let DEBUG_currentRandomId;
const DEBUG_invalidateGlobalOnTickEnd = throttleWithTickEnd(() => {
    DEBUG_currentRandomId = Math.random();
});
const actionHandlers = {};
const callbacks = [updateContainers];
const actions = {};
const containers = new Map();
const runCallbacksThrottled = throttleWithTickEnd(runCallbacks);
let forceOnHeavyAnimation = true;
function runCallbacks() {
    if (forceOnHeavyAnimation) {
        forceOnHeavyAnimation = false;
    }
    else if (getIsHeavyAnimating()) {
        getIsHeavyAnimating.once(runCallbacksThrottled);
        return;
    }
    callbacks.forEach((cb) => cb(currentGlobal));
}
export function setUntypedGlobal(newGlobal, options) {
    if (typeof newGlobal === 'object' && newGlobal !== currentGlobal) {
        if (DEBUG) {
            if (!options?.forceOutdated
                && newGlobal.DEBUG_randomId && newGlobal.DEBUG_randomId !== DEBUG_currentRandomId) {
                throw new Error('[TeactN.setGlobal] Attempt to set an outdated global');
            }
            DEBUG_currentRandomId = Math.random();
        }
        currentGlobal = newGlobal;
        if (options?.forceSyncOnIOs) {
            forceOnHeavyAnimation = true;
            runCallbacks();
        }
        else {
            if (options?.forceOnHeavyAnimation) {
                forceOnHeavyAnimation = true;
            }
            runCallbacksThrottled();
        }
    }
}
export function getUntypedGlobal() {
    if (DEBUG) {
        currentGlobal = {
            ...currentGlobal,
            DEBUG_randomId: DEBUG_currentRandomId,
        };
        DEBUG_invalidateGlobalOnTickEnd();
    }
    return currentGlobal;
}
export function getUntypedActions() {
    return actions;
}
export function forceOnHeavyAnimationOnce() {
    forceOnHeavyAnimation = true;
}
let actionQueue = [];
function handleAction(name, payload, options) {
    const deferred = new Deferred();
    actionQueue.push(() => {
        actionHandlers[name]?.forEach((handler) => {
            const response = handler(DEBUG ? getUntypedGlobal() : currentGlobal, actions, payload);
            if (!response) {
                deferred.resolve();
                return;
            }
            if (typeof response.then === 'function') {
                response.then(() => {
                    deferred.resolve();
                });
                return;
            }
            setUntypedGlobal(response, options);
            deferred.resolve();
        });
    });
    if (actionQueue.length === 1) {
        try {
            while (actionQueue.length) {
                actionQueue[0]();
                actionQueue.shift();
            }
        }
        finally {
            actionQueue = [];
        }
    }
    return deferred.promise;
}
function updateContainers() {
    let DEBUG_startAt;
    if (DEBUG) {
        DEBUG_startAt = performance.now();
    }
    for (const container of containers.values()) {
        const { mapStateToProps, ownProps, mappedProps, forceUpdate, } = container;
        if (!activateContainer(container, currentGlobal, ownProps)) {
            continue;
        }
        let newMappedProps;
        try {
            newMappedProps = mapStateToProps(currentGlobal, ownProps);
        }
        catch (err) {
            handleError(err);
            return;
        }
        if (DEBUG) {
            if (Object.values(newMappedProps).some(Number.isNaN)) {
                // eslint-disable-next-line no-console
                console.warn(
                // eslint-disable-next-line @stylistic/max-len
                `[TeactN] Some of \`${container.DEBUG_componentName}\` mappers contain NaN values. This may cause redundant updates because of incorrect equality check.`);
            }
        }
        if (Object.keys(newMappedProps).length && !arePropsShallowEqual(mappedProps, newMappedProps)) {
            if (DEBUG_MORE) {
                logUnequalProps(mappedProps, newMappedProps, `[TeactN] Will update ${container.DEBUG_componentName} caused by:`);
            }
            container.mappedProps = newMappedProps;
            container.DEBUG_updates++;
            forceUpdate();
        }
    }
    if (DEBUG) {
        const updateTime = performance.now() - DEBUG_startAt;
        if (updateTime > 7) {
            // eslint-disable-next-line no-console
            console.warn(`[TeactN] Slow containers update: ${Math.round(updateTime)} ms`);
        }
    }
}
export function addUntypedActionHandler(name, handler) {
    if (!actionHandlers[name]) {
        actionHandlers[name] = [];
        actions[name] = (payload, options) => {
            return handleAction(name, payload, options);
        };
    }
    actionHandlers[name].push(handler);
}
export function addCallback(cb) {
    callbacks.push(cb);
}
export function removeCallback(cb) {
    const index = callbacks.indexOf(cb);
    if (index !== -1) {
        callbacks.splice(index, 1);
    }
}
export function withUntypedGlobal(mapStateToProps = () => ({}), activationFn) {
    return (Component) => {
        function TeactNContainer(props) {
            const id = useUniqueId();
            const forceUpdate = useForceUpdate();
            useUnmountCleanup(() => {
                containers.delete(id);
            });
            let container = containers.get(id);
            if (!container) {
                container = {
                    mapStateToProps,
                    activationFn,
                    ownProps: props,
                    forceUpdate,
                    DEBUG_updates: 0,
                    DEBUG_componentName: Component.name,
                };
                containers.set(id, container);
            }
            if ((!container.mappedProps || !arePropsShallowEqual(container.ownProps, props))
                && activateContainer(container, currentGlobal, props)) {
                try {
                    container.mappedProps = mapStateToProps(currentGlobal, props);
                }
                catch (err) {
                    handleError(err);
                }
            }
            container.ownProps = props;
            return <Component {...container.mappedProps} {...props}/>;
        }
        TeactNContainer.DEBUG_contentComponentName = DEBUG_resolveComponentName(Component);
        return TeactNContainer;
    };
}
function activateContainer(container, global, props) {
    const { activationFn, stuckTo } = container;
    if (!activationFn) {
        return true;
    }
    return activationFn(global, props, (stickTo) => {
        if (stuckTo) {
            return stuckTo === stickTo;
        }
        else if (stickTo !== undefined) {
            container.stuckTo = stickTo;
        }
        return true;
    });
}
export function typify() {
    return {
        getGlobal: getUntypedGlobal,
        setGlobal: setUntypedGlobal,
        getActions: getUntypedActions,
        getPromiseActions: getUntypedActions,
        addActionHandler: addUntypedActionHandler,
        withGlobal: withUntypedGlobal,
    };
}
if (DEBUG) {
    window.getGlobal = getUntypedGlobal;
    window.setGlobal = setUntypedGlobal;
    window.getActions = getUntypedActions;
    document.addEventListener('dblclick', () => {
        // eslint-disable-next-line no-console
        console.warn('GLOBAL CONTAINERS', orderBy(Array.from(containers.values())
            .map(({ DEBUG_componentName, DEBUG_updates }) => ({ DEBUG_componentName, DEBUG_updates })), 'DEBUG_updates', 'desc'));
    });
}
