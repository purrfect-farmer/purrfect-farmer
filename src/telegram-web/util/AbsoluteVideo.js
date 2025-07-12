import { requestMeasure, requestMutation } from '../lib/fasterdom/fasterdom';
import safePlay from './safePlay';
export default class AbsoluteVideo {
    container;
    options;
    video;
    isPlaying = false;
    constructor(videoUrl, container, options) {
        this.container = container;
        this.options = options;
        this.video = document.createElement('video');
        this.video.src = videoUrl;
        this.video.disablePictureInPicture = true;
        this.video.muted = true;
        if (options.style) {
            this.video.setAttribute('style', options.style);
        }
        this.video.style.position = 'absolute';
        this.video.load();
        if (!this.options.noLoop) {
            this.video.loop = true;
        }
        requestMutation(() => {
            this.container.appendChild(this.video);
            this.recalculatePositionAndSize();
        });
    }
    play() {
        if (this.isPlaying || !this.video)
            return;
        this.recalculatePositionAndSize();
        if (this.video.paused) {
            safePlay(this.video);
        }
        this.isPlaying = true;
    }
    pause() {
        if (!this.isPlaying || !this.video)
            return;
        if (!this.video.paused) {
            this.video.pause();
        }
        this.isPlaying = false;
    }
    destroy() {
        this.pause();
        this.video?.remove();
        this.video = undefined;
    }
    updatePosition(position) {
        this.options.position = position;
        this.recalculatePositionAndSize();
    }
    recalculatePositionAndSize() {
        const { size, position: { x, y } } = this.options;
        requestMeasure(() => {
            if (!this.video)
                return;
            const video = this.video;
            const { width, height } = this.container.getBoundingClientRect();
            requestMutation(() => {
                video.style.left = `${Math.round(x * width)}px`;
                video.style.top = `${Math.round(y * height)}px`;
                video.style.width = `${size}px`;
                video.style.height = `${size}px`;
            });
        });
    }
}
