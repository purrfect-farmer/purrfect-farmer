import { useEffect } from '../../../lib/teact/teact';
import { getGlobal } from '../../../global';
import { ApiMediaFormat } from '../../../api/types';
import { getStoryMediaHash } from '../../../global/helpers';
import { selectPeerStories } from '../../../global/selectors';
import unloadVideo from '../../../util/browser/unloadVideo';
import { preloadImage } from '../../../util/files';
import * as mediaLoader from '../../../util/mediaLoader';
import { getProgressiveUrl } from '../../../util/mediaLoader';
import { makeProgressiveLoader } from '../../../util/progressiveLoader';
import { pause } from '../../../util/schedulers';
import { PRIMARY_VIDEO_MIME } from '../helpers/videoFormats';
import { checkIfStreamingSupported } from '../../../hooks/useStreaming';
const preloadedStories = {};
const PEER_STORIES_FOR_PRELOAD = 5;
const PROGRESSIVE_PRELOAD_DURATION = 1000;
const STREAM_PRELOAD_SIZE = 1024 * 1024 * 2; // 2 MB
const FIRST_PRELOAD_DELAY = 1000;
const canPreload = pause(FIRST_PRELOAD_DELAY);
function useStoryPreloader(peerId, aroundStoryId) {
    useEffect(() => {
        if (peerId === undefined)
            return;
        const preloadHashes = async (mediaHashes) => {
            await canPreload;
            mediaHashes.forEach(({ hash, format, isStream }) => {
                if (isStream) {
                    preloadStream(hash);
                    return;
                }
                mediaLoader.fetch(hash, format)
                    .then((result) => {
                    if (!result)
                        return;
                    if (format === ApiMediaFormat.Progressive) {
                        preloadProgressive(result);
                    }
                    if (format === ApiMediaFormat.BlobUrl) {
                        preloadImage(result);
                    }
                });
            });
        };
        const peerIds = Array.isArray(peerId) ? peerId : [peerId];
        peerIds.forEach((id) => {
            const storyId = aroundStoryId || getGlobal().stories.byPeerId[id]?.orderedIds?.[0];
            if (!storyId)
                return;
            preloadHashes(getPreloadMediaHashes(id, storyId));
        });
    }, [aroundStoryId, peerId]);
}
function findIdsAroundCurrentId(ids, currentId, aroundAmount) {
    const currentIndex = ids.indexOf(currentId);
    const start = Math.max(currentIndex - aroundAmount, 0);
    const end = Math.min(currentIndex + aroundAmount, ids.length);
    return ids.slice(start, end);
}
function getPreloadMediaHashes(peerId, storyId) {
    const peerStories = selectPeerStories(getGlobal(), peerId);
    if (!peerStories || !peerStories.orderedIds?.length) {
        return [];
    }
    const preloadIds = findIdsAroundCurrentId(peerStories.orderedIds, storyId, PEER_STORIES_FOR_PRELOAD);
    const mediaHashes = [];
    preloadIds.forEach((currentStoryId) => {
        if (preloadedStories[peerId]?.has(currentStoryId)) {
            return;
        }
        const story = peerStories.byId[currentStoryId];
        if (!story || !('content' in story)) {
            return;
        }
        const isVideo = Boolean(story.content.video);
        // Media
        mediaHashes.push({
            hash: getStoryMediaHash(story, 'full'),
            format: isVideo ? ApiMediaFormat.Progressive : ApiMediaFormat.BlobUrl,
            isStream: isVideo && checkIfStreamingSupported(PRIMARY_VIDEO_MIME),
        });
        // Thumbnail
        mediaHashes.push({ hash: getStoryMediaHash(story), format: ApiMediaFormat.BlobUrl });
        if (story.content.altVideos) {
            mediaHashes.push({
                hash: getStoryMediaHash(story, 'full', true),
                format: ApiMediaFormat.Progressive,
            });
        }
        preloadedStories[peerId] = (preloadedStories[peerId] || new Set()).add(currentStoryId);
    });
    return mediaHashes;
}
function preloadProgressive(url) {
    const head = document.head;
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = url;
    video.muted = true;
    video.autoplay = true;
    video.disableRemotePlayback = true;
    video.style.display = 'none';
    head.appendChild(video);
    video.load();
    setTimeout(() => {
        unloadVideo(video);
        head.removeChild(video);
    }, PROGRESSIVE_PRELOAD_DURATION);
}
async function preloadStream(hash) {
    const loader = makeProgressiveLoader(getProgressiveUrl(hash));
    let cachedSize = 0;
    for await (const chunk of loader) {
        cachedSize += chunk.byteLength;
        if (cachedSize >= STREAM_PRELOAD_SIZE) {
            break;
        }
    }
}
export default useStoryPreloader;
