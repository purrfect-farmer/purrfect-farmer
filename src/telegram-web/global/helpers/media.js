import { getPhotoMediaHash, getVideoMediaHash } from './messageMedia';
const STORY_ALT_VIDEO_WIDTH = 480;
export function getStoryMediaHash(story, size = 'preview', isAlt) {
    const isVideo = Boolean(story.content.video);
    if (isVideo) {
        if (isAlt && !story.content.altVideos)
            return undefined;
        const media = isAlt ? getPreferredAlt(story.content.altVideos) : story.content.video;
        return getVideoMediaHash(media, size);
    }
    return getPhotoMediaHash(story.content.photo, size);
}
function getPreferredAlt(alts) {
    const alt = alts.reduce((prev, curr) => (Math.abs((curr.width || 0) - STORY_ALT_VIDEO_WIDTH) < Math.abs((prev.width || 0) - STORY_ALT_VIDEO_WIDTH)
        ? curr : prev));
    return alt;
}
export function getStoryKey(chatId, storyId) {
    return `story${chatId}-${storyId}`;
}
