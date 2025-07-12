import { Api as GramJs } from '../../../lib/gramjs';
import { CHANNEL_ID_BASE } from '../../../config';
import { numberToHexColor } from '../../../util/colors';
export function isMtpPeerUser(peer) {
    return peer.hasOwnProperty('userId');
}
export function isMtpPeerChat(peer) {
    return peer.hasOwnProperty('chatId');
}
export function isMtpPeerChannel(peer) {
    return peer.hasOwnProperty('channelId');
}
export function buildApiPeerId(id, type) {
    if (type === 'user') {
        return id.toString();
    }
    if (type === 'channel') {
        return id.add(CHANNEL_ID_BASE).negate().toString();
    }
    return id.negate().toString();
}
export function getApiChatIdFromMtpPeer(peer) {
    if (isMtpPeerUser(peer)) {
        return buildApiPeerId(peer.userId, 'user');
    }
    else if (isMtpPeerChat(peer)) {
        return buildApiPeerId(peer.chatId, 'chat');
    }
    else {
        return buildApiPeerId(peer.channelId, 'channel');
    }
}
export function buildApiPeerColor(peerColor) {
    const { color, backgroundEmojiId } = peerColor;
    return {
        color,
        backgroundEmojiId: backgroundEmojiId?.toString(),
    };
}
export function buildApiEmojiStatus(mtpEmojiStatus) {
    if (mtpEmojiStatus instanceof GramJs.EmojiStatus) {
        return {
            type: 'regular',
            documentId: mtpEmojiStatus.documentId.toString(),
            until: mtpEmojiStatus.until,
        };
    }
    if (mtpEmojiStatus instanceof GramJs.EmojiStatusCollectible) {
        return {
            type: 'collectible',
            collectibleId: mtpEmojiStatus.collectibleId.toString(),
            documentId: mtpEmojiStatus.documentId.toString(),
            title: mtpEmojiStatus.title,
            slug: mtpEmojiStatus.slug,
            patternDocumentId: mtpEmojiStatus.patternDocumentId.toString(),
            centerColor: numberToHexColor(mtpEmojiStatus.centerColor),
            edgeColor: numberToHexColor(mtpEmojiStatus.edgeColor),
            patternColor: numberToHexColor(mtpEmojiStatus.patternColor),
            textColor: numberToHexColor(mtpEmojiStatus.textColor),
            until: mtpEmojiStatus.until,
        };
    }
    return undefined;
}
