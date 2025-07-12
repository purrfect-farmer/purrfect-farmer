import { requestMeasure } from '../lib/fasterdom/fasterdom';
let currentInstance;
export function animateSingle(tick, schedulerFn, instance) {
    if (!instance) {
        if (currentInstance && !currentInstance.isCancelled) {
            currentInstance.isCancelled = true;
        }
        instance = { isCancelled: false };
        currentInstance = instance;
    }
    if (!instance.isCancelled && tick()) {
        schedulerFn(() => {
            animateSingle(tick, schedulerFn, instance);
        });
    }
}
export function cancelSingleAnimation() {
    const dumbScheduler = (cb) => cb;
    const dumbCb = () => undefined;
    animateSingle(dumbCb, dumbScheduler);
}
export function animate(tick, schedulerFn) {
    schedulerFn(() => {
        if (tick()) {
            animate(tick, schedulerFn);
        }
    });
}
export function animateInstantly(tick, schedulerFn) {
    if (tick()) {
        schedulerFn(() => {
            animateInstantly(tick, schedulerFn);
        });
    }
}
export const timingFunctions = {
    linear: (t) => t,
    easeIn: (t) => t ** 1.675,
    easeOut: (t) => -1 * t ** 1.675,
    easeInOut: (t) => 0.5 * (Math.sin((t - 0.5) * Math.PI) + 1),
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: (t) => t ** 3,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => (t < 0.5 ? 4 * t ** 3 : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
    easeInQuart: (t) => t ** 4,
    easeOutQuart: (t) => 1 - (--t) * t ** 3,
    easeInOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - 8 * (--t) * t ** 3),
    easeInQuint: (t) => t ** 5,
    easeOutQuint: (t) => 1 + (--t) * t ** 4,
    easeInOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 + 16 * (--t) * t ** 4),
};
export function animateNumber({ timing = timingFunctions.linear, onUpdate, duration, onEnd, from, to, }) {
    const t0 = Date.now();
    let isCanceled = false;
    animateInstantly(() => {
        if (isCanceled)
            return false;
        const t1 = Date.now();
        const t = Math.min((t1 - t0) / duration, 1);
        const progress = timing(t);
        if (typeof from === 'number' && typeof to === 'number') {
            onUpdate((from + ((to - from) * progress)));
        }
        else if (Array.isArray(from) && Array.isArray(to)) {
            const result = from.map((f, i) => f + ((to[i] - f) * progress));
            onUpdate(result);
        }
        if (t === 1) {
            onEnd?.();
        }
        return t < 1;
    }, requestMeasure);
    return () => {
        isCanceled = true;
        onEnd?.(true);
    };
}
export function applyStyles(element, css) {
    Object.assign(element.style, css);
}
