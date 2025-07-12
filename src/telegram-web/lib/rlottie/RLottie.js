import { animate } from '../../util/animation';
import { IS_ANDROID, IS_IOS, IS_SAFARI, } from '../../util/browser/windowEnvironment';
import cycleRestrict from '../../util/cycleRestrict';
import Deferred from '../../util/Deferred';
import generateUniqueId from '../../util/generateUniqueId';
import launchMediaWorkers, { MAX_WORKERS } from '../../util/launchMediaWorkers';
import { requestMeasure, requestMutation } from '../fasterdom/fasterdom';
const WAITING = Symbol('WAITING');
const HIGH_PRIORITY_QUALITY = (IS_ANDROID || IS_IOS) ? 0.75 : 1;
const LOW_PRIORITY_QUALITY = IS_ANDROID ? 0.5 : 0.75;
const LOW_PRIORITY_QUALITY_SIZE_THRESHOLD = 24;
const HIGH_PRIORITY_CACHE_MODULO = IS_SAFARI ? 2 : 4;
const LOW_PRIORITY_CACHE_MODULO = 0;
const CANVAS_CLASS = 'rlottie-canvas';
const workers = launchMediaWorkers().map(({ connector }) => connector);
const instancesByRenderId = new Map();
const PENDING_CANVAS_RESIZES = new WeakMap();
let lastWorkerIndex = -1;
class RLottie {
    tgsUrl;
    container;
    renderId;
    params;
    customColor;
    onLoad;
    onEnded;
    onLoop;
    // Config
    views = new Map();
    imgSize;
    imageData;
    msPerFrame = 1000 / 60;
    reduceFactor = 1;
    cacheModulo;
    workerIndex;
    frames = [];
    framesCount;
    // State
    isAnimating = false;
    isWaiting = true;
    isEnded = false;
    isDestroyed = false;
    isRendererInited = false;
    approxFrameIndex = 0;
    prevFrameIndex = -1;
    stopFrameIndex = 0;
    speed = 1;
    direction = 1;
    lastRenderAt;
    static init(...args) {
        const [, canvas, renderId, params, viewId = generateUniqueId(), , onLoad,] = args;
        let instance = instancesByRenderId.get(renderId);
        if (!instance) {
            instance = new RLottie(...args);
            instancesByRenderId.set(renderId, instance);
        }
        else {
            instance.addView(viewId, canvas, onLoad, params?.coords);
        }
        return instance;
    }
    constructor(tgsUrl, container, renderId, params, viewId = generateUniqueId(), customColor, onLoad, onEnded, onLoop) {
        this.tgsUrl = tgsUrl;
        this.container = container;
        this.renderId = renderId;
        this.params = params;
        this.customColor = customColor;
        this.onLoad = onLoad;
        this.onEnded = onEnded;
        this.onLoop = onLoop;
        this.addView(viewId, container, onLoad, params.coords);
        this.initConfig();
        this.initRenderer();
    }
    removeView(viewId) {
        const { canvas, ctx, isSharedCanvas, coords, } = this.views.get(viewId);
        if (isSharedCanvas) {
            ctx.clearRect(coords.x, coords.y, this.imgSize, this.imgSize);
        }
        else {
            canvas.remove();
        }
        this.views.delete(viewId);
        if (!this.views.size) {
            this.destroy();
        }
    }
    isPlaying() {
        return this.isAnimating || this.isWaiting;
    }
    play(forceRestart = false, viewId) {
        if (viewId) {
            this.views.get(viewId).isPaused = false;
        }
        if (this.isEnded && forceRestart) {
            this.approxFrameIndex = Math.floor(0);
        }
        this.stopFrameIndex = undefined;
        this.direction = 1;
        this.doPlay();
    }
    pause(viewId) {
        this.lastRenderAt = undefined;
        if (viewId) {
            this.views.get(viewId).isPaused = true;
            const areAllContainersPaused = Array.from(this.views.values()).every(({ isPaused }) => isPaused);
            if (!areAllContainersPaused) {
                return;
            }
        }
        if (this.isWaiting) {
            this.stopFrameIndex = this.approxFrameIndex;
        }
        else {
            this.isAnimating = false;
        }
        if (!this.params.isLowPriority) {
            this.frames = this.frames.map((frame, i) => {
                if (i === this.prevFrameIndex) {
                    return frame;
                }
                else {
                    if (frame && frame !== WAITING) {
                        frame.close();
                    }
                    return undefined;
                }
            });
        }
    }
    playSegment([startFrameIndex, stopFrameIndex], forceRestart = false, viewId) {
        if (viewId) {
            this.views.get(viewId).isPaused = false;
        }
        const frameIndex = Math.round(this.approxFrameIndex);
        this.stopFrameIndex = Math.floor(stopFrameIndex / this.reduceFactor);
        if (frameIndex !== stopFrameIndex || forceRestart) {
            this.approxFrameIndex = Math.floor(startFrameIndex / this.reduceFactor);
        }
        this.direction = startFrameIndex < stopFrameIndex ? 1 : -1;
        this.doPlay();
    }
    setSpeed(speed) {
        this.speed = speed;
    }
    setNoLoop(noLoop) {
        this.params.noLoop = noLoop;
    }
    async setSharedCanvasCoords(viewId, newCoords) {
        const containerInfo = this.views.get(viewId);
        const { canvas, ctx, } = containerInfo;
        const isCanvasDirty = !canvas.dataset.isJustCleaned || canvas.dataset.isJustCleaned === 'false';
        if (!isCanvasDirty) {
            await PENDING_CANVAS_RESIZES.get(canvas);
        }
        let [canvasWidth, canvasHeight] = [canvas.width, canvas.height];
        if (isCanvasDirty) {
            const sizeFactor = this.calcSizeFactor();
            ([canvasWidth, canvasHeight] = ensureCanvasSize(canvas, sizeFactor));
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            canvas.dataset.isJustCleaned = 'true';
            requestMeasure(() => {
                canvas.dataset.isJustCleaned = 'false';
            });
        }
        containerInfo.coords = {
            x: Math.round((newCoords?.x || 0) * canvasWidth),
            y: Math.round((newCoords?.y || 0) * canvasHeight),
        };
        const frame = this.getFrame(this.prevFrameIndex) || this.getFrame(Math.round(this.approxFrameIndex));
        if (frame && frame !== WAITING) {
            ctx.drawImage(frame, containerInfo.coords.x, containerInfo.coords.y);
        }
    }
    addView(viewId, container, onLoad, coords) {
        const sizeFactor = this.calcSizeFactor();
        let imgSize;
        if (container instanceof HTMLDivElement) {
            if (!(container.parentNode instanceof HTMLElement)) {
                throw new Error('[RLottie] Container is not mounted');
            }
            const { size } = this.params;
            imgSize = Math.round(size * sizeFactor);
            if (!this.imgSize) {
                this.imgSize = imgSize;
                this.imageData = new ImageData(imgSize, imgSize);
            }
            requestMutation(() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.classList.add(CANVAS_CLASS);
                canvas.style.width = `${size}px`;
                canvas.style.height = `${size}px`;
                canvas.width = imgSize;
                canvas.height = imgSize;
                container.appendChild(canvas);
                this.views.set(viewId, {
                    canvas, ctx, onLoad,
                });
            });
        }
        else {
            if (!container.isConnected) {
                throw new Error('[RLottie] Shared canvas is not mounted');
            }
            const canvas = container;
            const ctx = canvas.getContext('2d');
            imgSize = Math.round(this.params.size * sizeFactor);
            if (!this.imgSize) {
                this.imgSize = imgSize;
                this.imageData = new ImageData(imgSize, imgSize);
            }
            const [canvasWidth, canvasHeight] = ensureCanvasSize(canvas, sizeFactor);
            this.views.set(viewId, {
                canvas,
                ctx,
                isSharedCanvas: true,
                coords: {
                    x: Math.round(coords.x * canvasWidth),
                    y: Math.round(coords.y * canvasHeight),
                },
                onLoad,
            });
        }
        if (this.isRendererInited) {
            this.doPlay();
        }
    }
    calcSizeFactor() {
        const { size, isLowPriority, 
        // Reduced quality only looks acceptable on big enough images
        quality = isLowPriority && (!size || size > LOW_PRIORITY_QUALITY_SIZE_THRESHOLD)
            ? LOW_PRIORITY_QUALITY : HIGH_PRIORITY_QUALITY, } = this.params;
        // Reduced quality only looks acceptable on high DPR screens
        return Math.max(window.devicePixelRatio * quality, 1);
    }
    destroy() {
        this.isDestroyed = true;
        this.pause();
        this.clearCache();
        this.destroyRenderer();
        instancesByRenderId.delete(this.renderId);
    }
    clearCache() {
        this.frames.forEach((frame) => {
            if (frame && frame !== WAITING) {
                frame.close();
            }
        });
        // Help GC
        this.imageData = undefined;
        this.frames = [];
    }
    initConfig() {
        const { isLowPriority } = this.params;
        this.cacheModulo = isLowPriority ? LOW_PRIORITY_CACHE_MODULO : HIGH_PRIORITY_CACHE_MODULO;
    }
    setColor(newColor) {
        this.customColor = newColor;
    }
    initRenderer() {
        this.workerIndex = cycleRestrict(MAX_WORKERS, ++lastWorkerIndex);
        workers[this.workerIndex].request({
            name: 'rlottie:init',
            args: [
                this.renderId,
                this.tgsUrl,
                this.imgSize,
                this.params.isLowPriority || false,
                this.customColor,
                this.onRendererInit.bind(this),
            ],
        });
    }
    destroyRenderer() {
        workers[this.workerIndex].request({
            name: 'rlottie:destroy',
            args: [this.renderId],
        });
    }
    onRendererInit(reduceFactor, msPerFrame, framesCount) {
        this.isRendererInited = true;
        this.reduceFactor = reduceFactor;
        this.msPerFrame = msPerFrame;
        this.framesCount = framesCount;
        if (this.isWaiting) {
            this.doPlay();
        }
    }
    changeData(tgsUrl) {
        this.pause();
        this.tgsUrl = tgsUrl;
        this.initConfig();
        workers[this.workerIndex].request({
            name: 'rlottie:changeData',
            args: [
                this.renderId,
                this.tgsUrl,
                this.params.isLowPriority || false,
                this.onChangeData.bind(this),
            ],
        });
    }
    onChangeData(reduceFactor, msPerFrame, framesCount) {
        this.reduceFactor = reduceFactor;
        this.msPerFrame = msPerFrame;
        this.framesCount = framesCount;
        this.isWaiting = false;
        this.isAnimating = false;
        this.doPlay();
    }
    doPlay() {
        if (!this.framesCount) {
            return;
        }
        if (this.isDestroyed) {
            return;
        }
        if (this.isAnimating) {
            return;
        }
        if (!this.isWaiting) {
            this.lastRenderAt = undefined;
        }
        this.isEnded = false;
        this.isAnimating = true;
        this.isWaiting = false;
        animate(() => {
            if (this.isDestroyed) {
                return false;
            }
            // Paused from outside
            if (!this.isAnimating) {
                const areAllLoaded = Array.from(this.views.values()).every(({ isLoaded }) => isLoaded);
                if (areAllLoaded) {
                    return false;
                }
            }
            const frameIndex = Math.round(this.approxFrameIndex);
            const frame = this.getFrame(frameIndex);
            if (!frame || frame === WAITING) {
                if (!frame) {
                    this.requestFrame(frameIndex);
                }
                this.isAnimating = false;
                this.isWaiting = true;
                return false;
            }
            if (this.cacheModulo && frameIndex % this.cacheModulo === 0) {
                this.cleanupPrevFrame(frameIndex);
            }
            if (frameIndex !== this.prevFrameIndex) {
                this.views.forEach((containerData) => {
                    const { ctx, isLoaded, isPaused, coords: { x, y } = {}, onLoad, } = containerData;
                    if (!isLoaded || !isPaused) {
                        ctx.clearRect(x || 0, y || 0, this.imgSize, this.imgSize);
                        ctx.drawImage(frame, x || 0, y || 0);
                    }
                    if (!isLoaded) {
                        containerData.isLoaded = true;
                        onLoad?.();
                    }
                });
                this.prevFrameIndex = frameIndex;
            }
            const now = Date.now();
            const currentSpeed = this.lastRenderAt ? this.msPerFrame / (now - this.lastRenderAt) : 1;
            const delta = (this.direction * this.speed) / currentSpeed;
            const expectedNextFrameIndex = Math.round(this.approxFrameIndex + delta);
            this.lastRenderAt = now;
            // Forward animation finished
            if (delta > 0 && (frameIndex === this.framesCount - 1 || expectedNextFrameIndex > this.framesCount - 1)) {
                if (this.params.noLoop) {
                    this.isAnimating = false;
                    this.isEnded = true;
                    this.onEnded?.();
                    return false;
                }
                this.onLoop?.();
                this.approxFrameIndex = 0;
                // Backward animation finished
            }
            else if (delta < 0 && (frameIndex === 0 || expectedNextFrameIndex < 0)) {
                if (this.params.noLoop) {
                    this.isAnimating = false;
                    this.isEnded = true;
                    this.onEnded?.();
                    return false;
                }
                this.onLoop?.();
                this.approxFrameIndex = this.framesCount - 1;
                // Stop frame reached
            }
            else if (this.stopFrameIndex !== undefined
                && (frameIndex === this.stopFrameIndex
                    || ((delta > 0 && expectedNextFrameIndex > this.stopFrameIndex)
                        || (delta < 0 && expectedNextFrameIndex < this.stopFrameIndex)))) {
                this.stopFrameIndex = undefined;
                this.isAnimating = false;
                return false;
                // Preparing next frame
            }
            else {
                this.approxFrameIndex += delta;
            }
            const nextFrameIndex = Math.round(this.approxFrameIndex);
            if (!this.getFrame(nextFrameIndex)) {
                this.requestFrame(nextFrameIndex);
                this.isWaiting = true;
                this.isAnimating = false;
                return false;
            }
            return true;
        }, requestMutation);
    }
    getFrame(frameIndex) {
        return this.frames[frameIndex];
    }
    requestFrame(frameIndex) {
        this.frames[frameIndex] = WAITING;
        workers[this.workerIndex].request({
            name: 'rlottie:renderFrames',
            args: [this.renderId, frameIndex, this.onFrameLoad.bind(this)],
        });
    }
    cleanupPrevFrame(frameIndex) {
        if (this.framesCount < 3) {
            return;
        }
        const prevFrameIndex = cycleRestrict(this.framesCount, frameIndex - 1);
        this.frames[prevFrameIndex] = undefined;
    }
    onFrameLoad(frameIndex, imageBitmap) {
        if (this.frames[frameIndex] !== WAITING) {
            return;
        }
        this.frames[frameIndex] = imageBitmap;
        if (this.isWaiting) {
            this.doPlay();
        }
    }
}
function ensureCanvasSize(canvas, sizeFactor) {
    const expectedWidth = Math.round(canvas.offsetWidth * sizeFactor);
    const expectedHeight = Math.round(canvas.offsetHeight * sizeFactor);
    if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
        const deferred = new Deferred();
        PENDING_CANVAS_RESIZES.set(canvas, deferred.promise);
        requestMutation(() => {
            canvas.width = expectedWidth;
            canvas.height = expectedHeight;
            deferred.resolve();
        });
    }
    return [expectedWidth, expectedHeight];
}
export default RLottie;
