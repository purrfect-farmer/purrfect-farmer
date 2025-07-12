import { Api as GramJs } from '../../../lib/gramjs';
import { buildCollectionByCallback, omitUndefined } from '../../../util/iteratees';
import { buildPrivacyRules } from './common';
import { buildGeoPoint, buildMessageMediaContent, buildMessageTextContent } from './messageContent';
import { buildApiMessage } from './messages';
import { buildApiPeerId, getApiChatIdFromMtpPeer } from './peers';
import { buildApiReaction, buildReactionCount } from './reactions';
export function buildApiStory(peerId, story) {
    if (story instanceof GramJs.StoryItemDeleted) {
        return {
            id: story.id,
            peerId,
            isDeleted: true,
        };
    }
    if (story instanceof GramJs.StoryItemSkipped) {
        const { id, date, expireDate, closeFriends, } = story;
        return {
            id,
            peerId,
            ...(closeFriends && { isForCloseFriends: true }),
            date,
            expireDate,
        };
    }
    const { edited, pinned, expireDate, id, date, caption, entities, media, privacy, views, public: isPublic, noforwards, closeFriends, contacts, selectedContacts, mediaAreas, sentReaction, out, fwdFrom, fromId, } = story;
    const content = {
        ...buildMessageMediaContent(media),
    };
    if (caption) {
        content.text = buildMessageTextContent(caption, entities);
    }
    const reaction = sentReaction && buildApiReaction(sentReaction);
    return omitUndefined({
        id,
        peerId,
        date,
        expireDate,
        content,
        isPublic,
        isEdited: edited,
        isInProfile: pinned,
        isForContacts: contacts,
        isForSelectedContacts: selectedContacts,
        isForCloseFriends: closeFriends,
        noForwards: noforwards,
        views: views && buildApiStoryViews(views),
        isOut: out,
        visibility: privacy && buildPrivacyRules(privacy),
        mediaAreas: mediaAreas?.map(buildApiMediaArea).filter(Boolean),
        sentReaction: reaction,
        forwardInfo: fwdFrom && buildApiStoryForwardInfo(fwdFrom),
        fromId: fromId && getApiChatIdFromMtpPeer(fromId),
    });
}
export function buildApiStoryViews(views) {
    return omitUndefined({
        hasViewers: views.hasViewers,
        viewsCount: views.viewsCount,
        forwardsCount: views.forwardsCount,
        reactionsCount: views.reactionsCount,
        reactions: views.reactions?.map(buildReactionCount).filter(Boolean),
        recentViewerIds: views.recentViewers?.map((viewerId) => buildApiPeerId(viewerId, 'user')),
    });
}
export function buildApiStoryView(view) {
    const { blockedMyStoriesFrom, blocked, } = view;
    if (view instanceof GramJs.StoryView) {
        return omitUndefined({
            type: 'user',
            peerId: buildApiPeerId(view.userId, 'user'),
            date: view.date,
            reaction: view.reaction && buildApiReaction(view.reaction),
            areStoriesBlocked: blocked || blockedMyStoriesFrom,
            isUserBlocked: blocked,
        });
    }
    if (view instanceof GramJs.StoryViewPublicForward) {
        const message = buildApiMessage(view.message);
        if (!message)
            return undefined;
        return {
            type: 'forward',
            peerId: message.chatId,
            messageId: message.id,
            message,
            date: message.date,
            areStoriesBlocked: blocked || blockedMyStoriesFrom,
            isUserBlocked: blocked,
        };
    }
    if (view instanceof GramJs.StoryViewPublicRepost) {
        const peerId = getApiChatIdFromMtpPeer(view.peerId);
        const story = buildApiStory(peerId, view.story);
        if (!('content' in story))
            return undefined;
        return {
            type: 'repost',
            peerId,
            storyId: view.story.id,
            date: story.date,
            story,
            areStoriesBlocked: blocked || blockedMyStoriesFrom,
            isUserBlocked: blocked,
        };
    }
    return undefined;
}
export function buildApiStealthMode(stealthMode) {
    return {
        activeUntil: stealthMode.activeUntilDate,
        cooldownUntil: stealthMode.cooldownUntilDate,
    };
}
function buildApiMediaAreaCoordinates(coordinates) {
    const { x, y, w, h, rotation, radius, } = coordinates;
    return {
        x,
        y,
        width: w,
        height: h,
        rotation,
        radius,
    };
}
export function buildApiMediaArea(area) {
    const coordinates = buildApiMediaAreaCoordinates(area.coordinates);
    if (area instanceof GramJs.MediaAreaVenue) {
        const { geo, title } = area;
        const point = buildGeoPoint(geo);
        if (!point)
            return undefined;
        return {
            type: 'venue',
            coordinates,
            geo: point,
            title,
        };
    }
    if (area instanceof GramJs.MediaAreaGeoPoint) {
        const { geo } = area;
        const point = buildGeoPoint(geo);
        if (!point)
            return undefined;
        return {
            type: 'geoPoint',
            coordinates,
            geo: point,
        };
    }
    if (area instanceof GramJs.MediaAreaSuggestedReaction) {
        const { reaction, dark, flipped, } = area;
        const apiReaction = buildApiReaction(reaction);
        if (!apiReaction) {
            return undefined;
        }
        return {
            type: 'suggestedReaction',
            coordinates,
            reaction: apiReaction,
            ...(dark && { isDark: true }),
            ...(flipped && { isFlipped: true }),
        };
    }
    if (area instanceof GramJs.MediaAreaChannelPost) {
        const { channelId, msgId } = area;
        return {
            type: 'channelPost',
            coordinates,
            channelId: buildApiPeerId(channelId, 'channel'),
            messageId: msgId,
        };
    }
    if (area instanceof GramJs.MediaAreaUrl) {
        const { url } = area;
        return {
            type: 'url',
            coordinates,
            url,
        };
    }
    if (area instanceof GramJs.MediaAreaWeather) {
        const { emoji, temperatureC, color, } = area;
        return {
            type: 'weather',
            coordinates,
            emoji,
            temperatureC,
            color,
        };
    }
    if (area instanceof GramJs.MediaAreaStarGift) {
        const { slug } = area;
        return {
            type: 'uniqueGift',
            coordinates,
            slug,
        };
    }
    return undefined;
}
export function buildApiPeerStories(peerStories) {
    const peerId = getApiChatIdFromMtpPeer(peerStories.peer);
    return buildCollectionByCallback(peerStories.stories, (story) => [story.id, buildApiStory(peerId, story)]);
}
export function buildApiStoryForwardInfo(forwardHeader) {
    const { from, fromName, storyId, modified, } = forwardHeader;
    return {
        storyId,
        fromPeerId: from && getApiChatIdFromMtpPeer(from),
        fromName,
        isModified: modified,
    };
}
