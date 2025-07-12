import { DEBUG, DEBUG_MORE } from '../../config';
import { logUnequalProps } from '../../util/arePropsShallowEqual';
import { incrementOverlayCounter } from '../../util/debugOverlay';
import { orderBy } from '../../util/iteratees';
import safeExec from '../../util/safeExec';
import { throttleWith } from '../../util/schedulers';
import { createSignal, isSignal } from '../../util/signals';
import { requestMeasure, requestMutation } from '../fasterdom/fasterdom';
import { getIsBlockingAnimating } from './heavyAnimation';
export { getIsHeavyAnimating, beginHeavyAnimation, onFullyIdle } from './heavyAnimation';
export var VirtualType;
(function (VirtualType) {
    VirtualType[VirtualType["Empty"] = 0] = "Empty";
    VirtualType[VirtualType["Text"] = 1] = "Text";
    VirtualType[VirtualType["Tag"] = 2] = "Tag";
    VirtualType[VirtualType["Component"] = 3] = "Component";
    VirtualType[VirtualType["Fragment"] = 4] = "Fragment";
})(VirtualType || (VirtualType = {}));
export var MountState;
(function (MountState) {
    MountState[MountState["Mounting"] = 0] = "Mounting";
    MountState[MountState["Mounted"] = 1] = "Mounted";
    MountState[MountState["Unmounted"] = 2] = "Unmounted";
})(MountState || (MountState = {}));
const Fragment = Symbol('Fragment');
const DEBUG_RENDER_THRESHOLD = 7;
const DEBUG_EFFECT_THRESHOLD = 7;
const DEBUG_SILENT_RENDERS_FOR = new Set(['TeactMemoWrapper', 'TeactNContainer', 'Button', 'ListItem', 'MenuItem']);
let contextCounter = 0;
let lastComponentId = 0;
let renderingInstance;
export function isParentElement($element) {
    return ($element.type === VirtualType.Tag
        || $element.type === VirtualType.Component
        || $element.type === VirtualType.Fragment);
}
function createElement(source, props, ...children) {
    if (source === Fragment) {
        return buildFragmentElement(children);
    }
    else if (typeof source === 'function') {
        return createComponentInstance(source, props || {}, children);
    }
    else {
        return buildTagElement(source, props || {}, children);
    }
}
function buildFragmentElement(children) {
    return {
        type: VirtualType.Fragment,
        children: buildChildren(children, true),
    };
}
function createComponentInstance(Component, props, children) {
    if (children?.length) {
        props.children = children.length === 1 ? children[0] : children;
    }
    const componentInstance = {
        id: -1,
        $element: undefined,
        Component,
        name: Component.name,
        props,
        mountState: MountState.Unmounted,
    };
    componentInstance.$element = buildComponentElement(componentInstance);
    return componentInstance.$element;
}
function buildComponentElement(componentInstance, children) {
    return {
        type: VirtualType.Component,
        componentInstance,
        props: componentInstance.props,
        children: children ? buildChildren(children, true) : [],
    };
}
function buildTagElement(tag, props, children) {
    return {
        type: VirtualType.Tag,
        tag,
        props,
        children: buildChildren(children),
    };
}
function buildChildren(children, noEmpty = false) {
    const cleanChildren = dropEmptyTail(children, noEmpty);
    const newChildren = [];
    for (let i = 0, l = cleanChildren.length; i < l; i++) {
        const child = cleanChildren[i];
        if (Array.isArray(child)) {
            newChildren.push(...buildChildren(child, noEmpty));
        }
        else {
            newChildren.push(buildChildElement(child));
        }
    }
    return newChildren;
}
// We only need placeholders in the middle of collection (to ensure other elements order).
function dropEmptyTail(children, noEmpty = false) {
    let i = children.length - 1;
    for (; i >= 0; i--) {
        if (!isEmptyPlaceholder(children[i])) {
            break;
        }
    }
    if (i === children.length - 1) {
        return children;
    }
    if (i === -1 && noEmpty) {
        return children.slice(0, 1);
    }
    return children.slice(0, i + 1);
}
function isEmptyPlaceholder(child) {
    return !child && child !== 0;
}
function buildChildElement(child) {
    if (isEmptyPlaceholder(child)) {
        return { type: VirtualType.Empty };
    }
    else if (isParentElement(child)) {
        return child;
    }
    else {
        return {
            type: VirtualType.Text,
            value: String(child),
        };
    }
}
const DEBUG_components = { TOTAL: { name: 'TOTAL', renders: 0 } };
const DEBUG_memos = {};
const DEBUG_MEMOS_CALLS_THRESHOLD = 20;
document.addEventListener('dblclick', () => {
    // eslint-disable-next-line no-console
    console.warn('COMPONENTS', orderBy(Object
        .values(DEBUG_components)
        .map(({ avgRenderTime, ...state }) => {
        return { ...state, ...(avgRenderTime !== undefined && { avgRenderTime: Number(avgRenderTime.toFixed(2)) }) };
    }), 'renders', 'desc'));
    // eslint-disable-next-line no-console
    console.warn('MEMOS', orderBy(Object
        .values(DEBUG_memos)
        .filter(({ calls }) => calls >= DEBUG_MEMOS_CALLS_THRESHOLD)
        .map((state) => ({ ...state, hitRate: Number(state.hitRate.toFixed(2)) })), 'hitRate', 'asc'));
});
let instancesPendingUpdate = new Set();
let idsToExcludeFromUpdate = new Set();
let pendingEffects = new Map();
let pendingCleanups = new Map();
let pendingLayoutEffects = new Map();
let pendingLayoutCleanups = new Map();
let areImmediateEffectsCaptured = false;
/*
  Order:
  - component effect cleanups
  - component effects
  - measure tasks
  - mutation tasks
  - component updates
  - component layout effect cleanups
  - component layout effects
  - forced layout measure tasks
  - forced layout mutation tasks
 */
const runUpdatePassOnRaf = throttleWith(requestMeasure, () => {
    if (getIsBlockingAnimating()) {
        getIsBlockingAnimating.once(runUpdatePassOnRaf);
        return;
    }
    const runImmediateEffects = captureImmediateEffects();
    idsToExcludeFromUpdate = new Set();
    const instancesToUpdate = Array
        .from(instancesPendingUpdate)
        .sort((a, b) => a.id - b.id);
    instancesPendingUpdate = new Set();
    const currentCleanups = pendingCleanups;
    pendingCleanups = new Map();
    currentCleanups.forEach((cb) => cb());
    const currentEffects = pendingEffects;
    pendingEffects = new Map();
    currentEffects.forEach((cb) => cb());
    requestMutation(() => {
        instancesToUpdate.forEach(prepareComponentForFrame);
        instancesToUpdate.forEach((instance) => {
            if (idsToExcludeFromUpdate.has(instance.id)) {
                return;
            }
            forceUpdateComponent(instance);
        });
        runImmediateEffects?.();
    });
});
export function captureImmediateEffects() {
    if (areImmediateEffectsCaptured) {
        return undefined;
    }
    areImmediateEffectsCaptured = true;
    return runCapturedImmediateEffects;
}
function runCapturedImmediateEffects() {
    const currentLayoutCleanups = pendingLayoutCleanups;
    pendingLayoutCleanups = new Map();
    currentLayoutCleanups.forEach((cb) => cb());
    const currentLayoutEffects = pendingLayoutEffects;
    pendingLayoutEffects = new Map();
    currentLayoutEffects.forEach((cb) => cb());
    areImmediateEffectsCaptured = false;
}
export function renderComponent(componentInstance) {
    idsToExcludeFromUpdate.add(componentInstance.id);
    const { Component, props } = componentInstance;
    let newRenderedValue;
    safeExec(() => {
        renderingInstance = componentInstance;
        if (componentInstance.hooks) {
            if (componentInstance.hooks.state) {
                componentInstance.hooks.state.cursor = 0;
            }
            if (componentInstance.hooks.effects) {
                componentInstance.hooks.effects.cursor = 0;
            }
            if (componentInstance.hooks.memos) {
                componentInstance.hooks.memos.cursor = 0;
            }
            if (componentInstance.hooks.refs) {
                componentInstance.hooks.refs.cursor = 0;
            }
        }
        let DEBUG_startAt;
        if (DEBUG) {
            const componentName = DEBUG_resolveComponentName(Component);
            if (!DEBUG_components[componentName]) {
                DEBUG_components[componentName] = {
                    name: componentName,
                    renders: 0,
                    avgRenderTime: 0,
                };
            }
            if (DEBUG_MORE) {
                if (!DEBUG_SILENT_RENDERS_FOR.has(componentName)) {
                    // eslint-disable-next-line no-console
                    console.log(`[Teact] Render ${componentName}`);
                }
            }
            DEBUG_startAt = performance.now();
        }
        newRenderedValue = Component(props);
        if (DEBUG) {
            const duration = performance.now() - DEBUG_startAt;
            const componentName = DEBUG_resolveComponentName(Component);
            if (duration > DEBUG_RENDER_THRESHOLD) {
                // eslint-disable-next-line no-console
                console.warn(`[Teact] Slow component render: ${componentName}, ${Math.round(duration)} ms`);
            }
            const { renders, avgRenderTime } = DEBUG_components[componentName];
            DEBUG_components[componentName].avgRenderTime = (avgRenderTime * renders + duration) / (renders + 1);
            DEBUG_components[componentName].renders++;
            DEBUG_components.TOTAL.renders++;
            if (DEBUG_MORE) {
                incrementOverlayCounter(`${componentName} renders`);
                incrementOverlayCounter(`${componentName} duration`, duration);
            }
        }
    }, {
        rescue: () => {
            // eslint-disable-next-line no-console
            console.error(`[Teact] Error while rendering component ${componentInstance.name}`, componentInstance);
            newRenderedValue = componentInstance.renderedValue;
        },
    });
    if (componentInstance.mountState === MountState.Mounted && newRenderedValue === componentInstance.renderedValue) {
        return componentInstance.$element;
    }
    componentInstance.renderedValue = newRenderedValue;
    const children = Array.isArray(newRenderedValue) ? newRenderedValue : [newRenderedValue];
    componentInstance.$element = buildComponentElement(componentInstance, children);
    return componentInstance.$element;
}
export function hasElementChanged($old, $new) {
    if (typeof $old !== typeof $new) {
        return true;
    }
    else if ($old.type !== $new.type) {
        return true;
    }
    else if ($old.type === VirtualType.Text && $new.type === VirtualType.Text) {
        return $old.value !== $new.value;
    }
    else if ($old.type === VirtualType.Tag && $new.type === VirtualType.Tag) {
        return ($old.tag !== $new.tag) || ($old.props.key !== $new.props.key);
    }
    else if ($old.type === VirtualType.Component && $new.type === VirtualType.Component) {
        return ($old.componentInstance.Component !== $new.componentInstance.Component) || ($old.props.key !== $new.props.key);
    }
    return false;
}
export function mountComponent(componentInstance) {
    componentInstance.id = ++lastComponentId;
    componentInstance.mountState = MountState.Mounting;
    renderComponent(componentInstance);
    componentInstance.mountState = MountState.Mounted;
    return componentInstance.$element;
}
export function unmountComponent(componentInstance) {
    if (componentInstance.mountState === MountState.Unmounted) {
        return;
    }
    idsToExcludeFromUpdate.add(componentInstance.id);
    if (componentInstance.hooks?.effects) {
        for (const effect of componentInstance.hooks.effects.byCursor) {
            if (effect.cleanup) {
                safeExec(effect.cleanup);
            }
            effect.cleanup = undefined;
            effect.releaseSignals?.();
        }
    }
    componentInstance.mountState = MountState.Unmounted;
    helpGc(componentInstance);
}
// We need to remove all references to DOM objects. We also clean all other references, just in case
function helpGc(componentInstance) {
    const { effects, state, memos, refs, } = componentInstance.hooks || {};
    if (effects) {
        for (const hook of effects.byCursor) {
            hook.schedule = undefined;
            hook.cleanup = undefined;
            hook.releaseSignals = undefined;
            hook.dependencies = undefined;
        }
    }
    if (state) {
        for (const hook of state.byCursor) {
            hook.value = undefined;
            hook.nextValue = undefined;
            hook.setter = undefined;
        }
    }
    if (memos) {
        for (const hook of memos.byCursor) {
            hook.value = undefined;
            hook.dependencies = undefined;
        }
    }
    if (refs) {
        for (const hook of refs.byCursor) {
            hook.current = undefined;
            hook.onChange = undefined;
        }
    }
    componentInstance.hooks = undefined;
    componentInstance.$element = undefined;
    componentInstance.renderedValue = undefined;
    componentInstance.onUpdate = undefined;
}
function prepareComponentForFrame(componentInstance) {
    if (componentInstance.mountState === MountState.Unmounted) {
        return;
    }
    if (componentInstance.hooks?.state) {
        for (const hook of componentInstance.hooks.state.byCursor) {
            hook.value = hook.nextValue;
        }
    }
}
function forceUpdateComponent(componentInstance) {
    if (componentInstance.mountState === MountState.Unmounted || !componentInstance.onUpdate) {
        return;
    }
    const currentElement = componentInstance.$element;
    renderComponent(componentInstance);
    if (componentInstance.$element !== currentElement) {
        componentInstance.onUpdate();
    }
}
export function useState(initial, debugKey) {
    if (!renderingInstance.hooks) {
        renderingInstance.hooks = {};
    }
    if (!renderingInstance.hooks.state) {
        renderingInstance.hooks.state = { cursor: 0, byCursor: [] };
    }
    const { cursor, byCursor } = renderingInstance.hooks.state;
    const componentInstance = renderingInstance;
    if (byCursor[cursor] === undefined) {
        byCursor[cursor] = {
            value: initial,
            nextValue: initial,
            setter: (newValue) => {
                if (componentInstance.mountState === MountState.Unmounted) {
                    return;
                }
                if (typeof newValue === 'function') {
                    newValue = newValue(byCursor[cursor].nextValue);
                }
                if (byCursor[cursor].nextValue === newValue) {
                    return;
                }
                byCursor[cursor].nextValue = newValue;
                instancesPendingUpdate.add(componentInstance);
                runUpdatePassOnRaf();
                if (DEBUG_MORE) {
                    // eslint-disable-next-line no-console
                    console.log('[Teact.useState]', DEBUG_resolveComponentName(componentInstance.Component), `State update at cursor #${cursor}${debugKey ? ` (${debugKey})` : ''}, next value: `, byCursor[cursor].nextValue);
                }
            },
        };
    }
    renderingInstance.hooks.state.cursor++;
    return [
        byCursor[cursor].value,
        byCursor[cursor].setter,
    ];
}
function useEffectBase(isLayout, effect, dependencies, debugKey) {
    if (!renderingInstance.hooks) {
        renderingInstance.hooks = {};
    }
    if (!renderingInstance.hooks.effects) {
        renderingInstance.hooks.effects = { cursor: 0, byCursor: [] };
    }
    const { cursor, byCursor } = renderingInstance.hooks.effects;
    const effectConfig = byCursor[cursor];
    const componentInstance = renderingInstance;
    function schedule() {
        scheduleEffect(componentInstance, cursor, effect, isLayout);
    }
    if (dependencies && effectConfig?.dependencies) {
        if (dependencies.some((dependency, i) => dependency !== effectConfig.dependencies[i])) {
            if (DEBUG && debugKey) {
                const causedBy = dependencies.reduce((res, newValue, i) => {
                    const prevValue = effectConfig.dependencies[i];
                    if (newValue !== prevValue) {
                        res.push(`${i}: ${String(prevValue)} => ${String(newValue)}`);
                    }
                    return res;
                }, []);
                // eslint-disable-next-line no-console
                console.log(`[Teact] Effect "${debugKey}" caused by dependencies.`, causedBy.join(', '));
            }
            schedule();
        }
    }
    else {
        if (debugKey) {
            // eslint-disable-next-line no-console
            console.log(`[Teact] Effect "${debugKey}" caused by missing dependencies.`);
        }
        schedule();
    }
    function setupSignals() {
        const cleanups = dependencies?.filter(isSignal).map((signal, i) => signal.subscribe(() => {
            if (debugKey) {
                // eslint-disable-next-line no-console
                console.log(`[Teact] Effect "${debugKey}" caused by signal #${i} new value:`, signal());
            }
            byCursor[cursor].schedule();
        }));
        if (!cleanups?.length) {
            return undefined;
        }
        return () => {
            for (const cleanup of cleanups) {
                cleanup();
            }
        };
    }
    if (effectConfig)
        effectConfig.schedule = undefined; // Help GC
    byCursor[cursor] = {
        ...effectConfig,
        dependencies,
        schedule,
    };
    if (!effectConfig) {
        byCursor[cursor].releaseSignals = setupSignals();
    }
    renderingInstance.hooks.effects.cursor++;
}
function scheduleEffect(componentInstance, cursor, effect, isLayout) {
    const { byCursor } = componentInstance.hooks.effects;
    const cleanup = byCursor[cursor]?.cleanup;
    const cleanupsContainer = isLayout ? pendingLayoutCleanups : pendingCleanups;
    const effectsContainer = isLayout ? pendingLayoutEffects : pendingEffects;
    const effectId = `${componentInstance.id}_${cursor}`;
    if (cleanup) {
        const runEffectCleanup = () => safeExec(() => {
            if (componentInstance.mountState === MountState.Unmounted) {
                return;
            }
            let DEBUG_startAt;
            if (DEBUG) {
                DEBUG_startAt = performance.now();
            }
            cleanup();
            if (DEBUG) {
                const duration = performance.now() - DEBUG_startAt;
                const componentName = DEBUG_resolveComponentName(componentInstance.Component);
                if (duration > DEBUG_EFFECT_THRESHOLD) {
                    // eslint-disable-next-line no-console
                    console.warn(`[Teact] Slow cleanup at effect cursor #${cursor}: ${componentName}, ${Math.round(duration)} ms`);
                }
            }
        }, {
            rescue: () => {
                // eslint-disable-next-line no-console
                console.error(`[Teact] Error in effect cleanup at cursor #${cursor} in ${componentInstance.name}`, componentInstance);
            },
            always: () => {
                byCursor[cursor].cleanup = undefined;
            },
        });
        cleanupsContainer.set(effectId, runEffectCleanup);
    }
    const runEffect = () => safeExec(() => {
        if (componentInstance.mountState === MountState.Unmounted) {
            return;
        }
        let DEBUG_startAt;
        if (DEBUG) {
            DEBUG_startAt = performance.now();
        }
        const result = effect();
        if (typeof result === 'function') {
            byCursor[cursor].cleanup = result;
        }
        if (DEBUG) {
            const duration = performance.now() - DEBUG_startAt;
            const componentName = DEBUG_resolveComponentName(componentInstance.Component);
            if (duration > DEBUG_EFFECT_THRESHOLD) {
                // eslint-disable-next-line no-console
                console.warn(`[Teact] Slow effect at cursor #${cursor}: ${componentName}, ${Math.round(duration)} ms`);
            }
        }
    }, {
        rescue: () => {
            // eslint-disable-next-line no-console
            console.error(`[Teact] Error in effect at cursor #${cursor} in ${componentInstance.name}`, componentInstance);
        },
    });
    effectsContainer.set(effectId, runEffect);
    runUpdatePassOnRaf();
}
export function useEffect(effect, dependencies, debugKey) {
    return useEffectBase(false, effect, dependencies, debugKey);
}
export function useLayoutEffect(effect, dependencies, debugKey) {
    return useEffectBase(true, effect, dependencies, debugKey);
}
export function useUnmountCleanup(cleanup) {
    if (!renderingInstance.hooks) {
        renderingInstance.hooks = {};
    }
    if (!renderingInstance.hooks.effects) {
        renderingInstance.hooks.effects = { cursor: 0, byCursor: [] };
    }
    const { cursor, byCursor } = renderingInstance.hooks.effects;
    if (!byCursor[cursor]) {
        byCursor[cursor] = {
            cleanup,
        };
    }
    renderingInstance.hooks.effects.cursor++;
}
export function useMemo(resolver, dependencies, debugKey, debugHitRateKey) {
    if (!renderingInstance.hooks) {
        renderingInstance.hooks = {};
    }
    if (!renderingInstance.hooks.memos) {
        renderingInstance.hooks.memos = { cursor: 0, byCursor: [] };
    }
    const { cursor, byCursor } = renderingInstance.hooks.memos;
    let { value } = byCursor[cursor] || {};
    let DEBUG_state;
    if (DEBUG && debugHitRateKey) {
        const instanceKey = `${debugHitRateKey}#${renderingInstance.id}`;
        DEBUG_state = DEBUG_memos[instanceKey];
        if (!DEBUG_state) {
            DEBUG_state = {
                key: instanceKey, calls: 0, misses: 0, hitRate: 0,
            };
            DEBUG_memos[instanceKey] = DEBUG_state;
        }
        DEBUG_state.calls++;
        DEBUG_state.hitRate = (DEBUG_state.calls - DEBUG_state.misses) / DEBUG_state.calls;
    }
    if (byCursor[cursor] === undefined
        || dependencies.length !== byCursor[cursor].dependencies.length
        || dependencies.some((dependency, i) => dependency !== byCursor[cursor].dependencies[i])) {
        if (DEBUG) {
            if (debugKey) {
                const msg = `[Teact.useMemo] ${renderingInstance.name} (${debugKey}): Update is caused by:`;
                if (!byCursor[cursor]) {
                    // eslint-disable-next-line no-console
                    console.log(`${msg} [first render]`);
                }
                else {
                    logUnequalProps(byCursor[cursor].dependencies, dependencies, msg, debugKey);
                }
            }
            if (DEBUG_state) {
                DEBUG_state.misses++;
                DEBUG_state.hitRate = (DEBUG_state.calls - DEBUG_state.misses) / DEBUG_state.calls;
                if (DEBUG_state.calls % 10 === 0
                    && DEBUG_state.calls >= DEBUG_MEMOS_CALLS_THRESHOLD
                    && DEBUG_state.hitRate < 0.25) {
                    // eslint-disable-next-line no-console
                    console.warn(`[Teact] ${DEBUG_state.key}: Hit rate is ${DEBUG_state.hitRate.toFixed(2)} for ${DEBUG_state.calls} calls`);
                }
            }
        }
        value = resolver();
    }
    byCursor[cursor] = {
        value,
        dependencies,
    };
    renderingInstance.hooks.memos.cursor++;
    return value;
}
export function useCallback(newCallback, dependencies, debugKey) {
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    return useMemo(() => newCallback, dependencies, debugKey);
}
export function useRef(initial) {
    if (!renderingInstance.hooks) {
        renderingInstance.hooks = {};
    }
    if (!renderingInstance.hooks.refs) {
        renderingInstance.hooks.refs = { cursor: 0, byCursor: [] };
    }
    const { cursor, byCursor } = renderingInstance.hooks.refs;
    if (!byCursor[cursor]) {
        byCursor[cursor] = {
            current: initial,
        };
    }
    renderingInstance.hooks.refs.cursor++;
    return byCursor[cursor];
}
export function createContext(defaultValue) {
    const contextId = String(contextCounter++);
    function TeactContextProvider(props) {
        const [getValue, setValue] = useSignal(props.value ?? defaultValue);
        // Create a new object to avoid mutations in the parent context
        renderingInstance.context = { ...renderingInstance.context };
        renderingInstance.context[contextId] = getValue;
        setValue(props.value);
        return props.children;
    }
    TeactContextProvider.DEBUG_contentComponentName = contextId;
    const context = {
        defaultValue,
        contextId,
        Provider: TeactContextProvider,
    };
    return context;
}
export function useContextSignal(context) {
    const [getDefaultValue] = useSignal(context.defaultValue);
    return renderingInstance.context?.[context.contextId] || getDefaultValue;
}
export function useSignal(initial) {
    const signalRef = useRef();
    signalRef.current ??= createSignal(initial);
    return signalRef.current;
}
export function memo(Component, debugKey) {
    function TeactMemoWrapper(props) {
        return useMemo(() => createElement(Component, props), 
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
        Object.values(props), debugKey, DEBUG_MORE ? DEBUG_resolveComponentName(renderingInstance.Component) : undefined);
    }
    TeactMemoWrapper.DEBUG_contentComponentName = DEBUG_resolveComponentName(Component);
    return TeactMemoWrapper;
}
export function DEBUG_resolveComponentName(Component) {
    const { name, DEBUG_contentComponentName } = Component;
    if (name === 'TeactNContainer') {
        return `container>${DEBUG_contentComponentName}`;
    }
    if (name === 'TeactMemoWrapper') {
        return `memo>${DEBUG_contentComponentName}`;
    }
    if (name === 'TeactContextProvider') {
        return `context>id${DEBUG_contentComponentName}`;
    }
    return name + (DEBUG_contentComponentName ? `>${DEBUG_contentComponentName}` : '');
}
export default {
    createElement,
    Fragment,
};
export { createElement, Fragment };
