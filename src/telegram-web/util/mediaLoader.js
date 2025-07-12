import { ApiMediaFormat, } from '../api/types';
import { DEBUG, ELECTRON_HOST_URL, IS_PACKAGED_ELECTRON, MEDIA_CACHE_DISABLED, MEDIA_CACHE_NAME, MEDIA_CACHE_NAME_AVATARS, } from '../config';
import { callApi, cancelApiProgress } from '../api/gramjs';
import { IS_OPUS_SUPPORTED, IS_PROGRESSIVE_SUPPORTED, } from './browser/windowEnvironment';
import * as cacheApi from './cacheApi';
import { fetchBlob } from './files';
import { ACCOUNT_SLOT } from './multiaccount';
import { oggToWav } from './oggToWav';
const asCacheApiType = {
    [ApiMediaFormat.BlobUrl]: cacheApi.Type.Blob,
    [ApiMediaFormat.Text]: cacheApi.Type.Text,
    [ApiMediaFormat.DownloadUrl]: undefined,
    [ApiMediaFormat.Progressive]: undefined,
};
const PROGRESSIVE_URL_PREFIX = `${IS_PACKAGED_ELECTRON ? ELECTRON_HOST_URL : '.'}/progressive/`;
const DOWNLOAD_URL_PREFIX = './download/';
const MAX_MEDIA_RETRIES = 5;
const memoryCache = new Map();
const fetchPromises = new Map();
const progressCallbacks = new Map();
const cancellableCallbacks = new Map();
export function fetch(url, mediaFormat, isHtmlAllowed = false, onProgress, callbackUniqueId) {
    if (mediaFormat === ApiMediaFormat.Progressive) {
        return (IS_PROGRESSIVE_SUPPORTED
            ? Promise.resolve(getProgressiveUrl(url))
            : fetch(url, ApiMediaFormat.BlobUrl, isHtmlAllowed, onProgress, callbackUniqueId));
    }
    if (mediaFormat === ApiMediaFormat.DownloadUrl) {
        return (IS_PROGRESSIVE_SUPPORTED
            ? Promise.resolve(getDownloadUrl(url))
            : fetch(url, ApiMediaFormat.BlobUrl, isHtmlAllowed, onProgress, callbackUniqueId));
    }
    if (!fetchPromises.has(url)) {
        const promise = fetchFromCacheOrRemote(url, mediaFormat, isHtmlAllowed)
            .catch((err) => {
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.warn(err);
            }
            return undefined;
        })
            .finally(() => {
            fetchPromises.delete(url);
            progressCallbacks.delete(url);
            cancellableCallbacks.delete(url);
        });
        fetchPromises.set(url, promise);
    }
    if (onProgress && callbackUniqueId) {
        let activeCallbacks = progressCallbacks.get(url);
        if (!activeCallbacks) {
            activeCallbacks = new Map();
            progressCallbacks.set(url, activeCallbacks);
        }
        activeCallbacks.set(callbackUniqueId, onProgress);
    }
    return fetchPromises.get(url);
}
export function getFromMemory(url) {
    return memoryCache.get(url);
}
export function cancelProgress(progressCallback) {
    progressCallbacks.forEach((map, url) => {
        map.forEach((callback) => {
            if (callback === progressCallback) {
                const parentCallback = cancellableCallbacks.get(url);
                if (!parentCallback)
                    return;
                cancelApiProgress(parentCallback);
                cancellableCallbacks.delete(url);
                progressCallbacks.delete(url);
            }
        });
    });
}
export function removeCallback(url, callbackUniqueId) {
    const callbacks = progressCallbacks.get(url);
    if (!callbacks)
        return;
    callbacks.delete(callbackUniqueId);
}
export function getProgressiveUrl(url) {
    const base = new URL(`${PROGRESSIVE_URL_PREFIX}${url}`, window.location.href);
    if (ACCOUNT_SLOT)
        base.searchParams.set('account', ACCOUNT_SLOT.toString());
    memoryCache.set(url, base.href); // Needed for hooks to detect document as already loaded and apply URL
    return base.href;
}
function getDownloadUrl(url) {
    const base = new URL(`${DOWNLOAD_URL_PREFIX}${url}`, window.location.href);
    if (ACCOUNT_SLOT)
        base.searchParams.set('account', ACCOUNT_SLOT.toString());
    return base.href;
}
async function fetchFromCacheOrRemote(url, mediaFormat, isHtmlAllowed, retryNumber = 0) {
    if (!MEDIA_CACHE_DISABLED) {
        const cacheName = url.startsWith('avatar') ? MEDIA_CACHE_NAME_AVATARS : MEDIA_CACHE_NAME;
        const cached = await cacheApi.fetch(cacheName, url, asCacheApiType[mediaFormat], isHtmlAllowed);
        if (cached) {
            let media = cached;
            if (cached.type === 'audio/ogg' && !IS_OPUS_SUPPORTED) {
                media = await oggToWav(media);
            }
            const prepared = prepareMedia(media);
            memoryCache.set(url, prepared);
            return prepared;
        }
    }
    const onProgress = makeOnProgress(url);
    cancellableCallbacks.set(url, onProgress);
    const remote = await callApi('downloadMedia', { url, mediaFormat, isHtmlAllowed }, onProgress);
    if (!remote) {
        if (retryNumber >= MAX_MEDIA_RETRIES) {
            throw new Error(`Failed to fetch media ${url}`);
        }
        await new Promise((resolve) => {
            setTimeout(resolve, getRetryTimeout(retryNumber));
        });
        // eslint-disable-next-line no-console
        if (DEBUG)
            console.debug(`Retrying to fetch media ${url}`);
        return fetchFromCacheOrRemote(url, mediaFormat, isHtmlAllowed, retryNumber + 1);
    }
    let { mimeType } = remote;
    let prepared = prepareMedia(remote.dataBlob);
    if (mimeType === 'audio/ogg' && !IS_OPUS_SUPPORTED) {
        const blob = await fetchBlob(prepared);
        URL.revokeObjectURL(prepared);
        const media = await oggToWav(blob);
        prepared = prepareMedia(media);
        mimeType = media.type;
    }
    memoryCache.set(url, prepared);
    return prepared;
}
function makeOnProgress(url) {
    const onProgress = (progress) => {
        progressCallbacks.get(url)?.forEach((callback) => {
            callback(progress);
            if (callback.isCanceled)
                onProgress.isCanceled = true;
        });
    };
    return onProgress;
}
function prepareMedia(mediaData) {
    if (mediaData instanceof Blob) {
        return URL.createObjectURL(mediaData);
    }
    return mediaData;
}
if (IS_PROGRESSIVE_SUPPORTED) {
    navigator.serviceWorker.addEventListener('message', async (e) => {
        const { type, messageId, params } = e.data;
        if (type !== 'requestPart') {
            return;
        }
        async function downloadWithRetry(retryNumber = 0) {
            const result = await callApi('downloadMedia', { mediaFormat: ApiMediaFormat.Progressive, ...params });
            if (!result) {
                if (retryNumber >= MAX_MEDIA_RETRIES) {
                    if (DEBUG) {
                        // eslint-disable-next-line no-console
                        console.warn(`Failed to download media part after ${MAX_MEDIA_RETRIES} retries:`, params.url);
                    }
                    return undefined;
                }
                await new Promise((resolve) => {
                    setTimeout(resolve, getRetryTimeout(retryNumber));
                });
                if (DEBUG) {
                    // eslint-disable-next-line no-console
                    console.debug(`Retrying to download media part ${params.url}, attempt ${retryNumber + 1}`);
                }
                return downloadWithRetry(retryNumber + 1);
            }
            return result;
        }
        const result = await downloadWithRetry();
        if (!result) {
            return;
        }
        const { arrayBuffer, mimeType, fullSize } = result;
        navigator.serviceWorker.controller.postMessage({
            type: 'partResponse',
            messageId,
            result: {
                arrayBuffer,
                mimeType,
                fullSize,
            },
        }, [arrayBuffer]);
    });
}
function getRetryTimeout(retryNumber) {
    // 250ms, 500ms, 1s, 2s, 4s
    return 250 * 2 ** retryNumber;
}
