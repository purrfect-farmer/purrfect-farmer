import { ApiMediaFormat } from '../../api/types';
import { IS_ANDROID, IS_IOS } from '../../util/browser/windowEnvironment';
import launchMediaWorkers, { MAX_WORKERS } from '../../util/launchMediaWorkers';
import { callApi } from '../../api/gramjs';
import { requestMutation } from '../fasterdom/fasterdom';
const IS_MOBILE = IS_ANDROID || IS_IOS;
const PREVIEW_SIZE_RATIO = (IS_ANDROID || IS_IOS) ? 0.3 : 0.25;
const MAX_FRAMES = IS_MOBILE ? 40 : 80;
const PREVIEW_MAX_SIDE = 200;
const connections = launchMediaWorkers();
let videoPreview;
export class VideoPreview {
    frames = new Map();
    currentTime = 0;
    canvas;
    constructor(url, canvas) {
        this.canvas = canvas;
        connections.forEach(({ connector }, index) => {
            void connector.request({
                name: 'video-preview:init',
                args: [
                    url,
                    MAX_FRAMES,
                    index,
                    MAX_WORKERS,
                    this.onFrame.bind(this),
                ],
            });
        });
    }
    onFrame(time, frame) {
        this.frames.set(time, frame);
        if (time === this.currentTime) {
            this.render(time);
        }
    }
    clearCache() {
        this.frames.forEach((frame) => {
            frame.close();
        });
        this.frames.clear();
    }
    render(time) {
        this.currentTime = time;
        const frame = this.frames.get(time);
        if (!frame)
            return false;
        requestMutation(() => {
            this.canvas.width = frame.width;
            this.canvas.height = frame.height;
            const ctx = this.canvas.getContext('2d');
            ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
        });
        return true;
    }
    destroy() {
        this.clearCache();
        connections.forEach(({ connector }) => {
            void connector.request({
                name: 'video-preview:destroy',
                args: [],
            });
        });
    }
}
export function getPreviewDimensions(width, height) {
    width = Math.round(width * PREVIEW_SIZE_RATIO);
    height = Math.round(height * PREVIEW_SIZE_RATIO);
    const ratio = width / height;
    if (width > PREVIEW_MAX_SIDE) {
        width = PREVIEW_MAX_SIDE;
        height = Math.round(width / ratio);
    }
    if (height > PREVIEW_MAX_SIDE) {
        height = PREVIEW_MAX_SIDE;
        width = Math.round(height * ratio);
    }
    return { width, height };
}
connections.forEach(({ worker }) => {
    worker.addEventListener('message', async (e) => {
        const { type, messageId, params } = e.data;
        if (type !== 'requestPart') {
            return;
        }
        const result = await callApi('downloadMedia', { mediaFormat: ApiMediaFormat.Progressive, ...params });
        if (!result) {
            return;
        }
        const { arrayBuffer } = result;
        worker.postMessage({
            type: 'partResponse',
            messageId,
            result: arrayBuffer,
        }, [arrayBuffer]);
    });
});
export function createVideoPreviews(url, canvas) {
    if (videoPreview) {
        videoPreview.destroy();
    }
    videoPreview = new VideoPreview(url, canvas);
    return () => {
        videoPreview?.destroy();
        videoPreview = undefined;
    };
}
export function renderVideoPreview(time) {
    if (!videoPreview)
        return false;
    return videoPreview.render(time);
}
