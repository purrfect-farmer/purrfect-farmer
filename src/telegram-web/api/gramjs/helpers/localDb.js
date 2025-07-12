import { Api as GramJs } from '../../../lib/gramjs';
import { buildApiPeerId, getApiChatIdFromMtpPeer } from '../apiBuilders/peers';
import localDb from '../localDb';
export function addMessageToLocalDb(message) {
    if (message instanceof GramJs.Message) {
        if (message.media)
            addMediaToLocalDb(message.media, message);
        if (message.replyTo instanceof GramJs.MessageReplyHeader && message.replyTo.replyMedia) {
            addMediaToLocalDb(message.replyTo.replyMedia, message);
        }
    }
    if (message instanceof GramJs.MessageService && 'photo' in message.action) {
        const photo = addMessageRepairInfo(message.action.photo, message);
        addPhotoToLocalDb(photo);
    }
    if (message instanceof GramJs.SponsoredMessage && message.photo) {
        addPhotoToLocalDb(message.photo);
    }
}
export function addMediaToLocalDb(media, context) {
    if (media instanceof GramJs.MessageMediaDocument && media.document) {
        const document = addMessageRepairInfo(media.document, context);
        addDocumentToLocalDb(document);
    }
    if (media instanceof GramJs.MessageMediaWebPage
        && media.webpage instanceof GramJs.WebPage) {
        if (media.webpage.document) {
            const document = addMessageRepairInfo(media.webpage.document, context);
            addDocumentToLocalDb(document);
        }
        if (media.webpage.photo) {
            const photo = addMessageRepairInfo(media.webpage.photo, context);
            addPhotoToLocalDb(photo);
        }
    }
    if (media instanceof GramJs.MessageMediaGame) {
        if (media.game.document) {
            const document = addMessageRepairInfo(media.game.document, context);
            addDocumentToLocalDb(document);
        }
        const photo = addMessageRepairInfo(media.game.photo, context);
        addPhotoToLocalDb(photo);
    }
    if (media instanceof GramJs.MessageMediaPhoto && media.photo) {
        const photo = addMessageRepairInfo(media.photo, context);
        addPhotoToLocalDb(photo);
    }
    if (media instanceof GramJs.MessageMediaInvoice) {
        if (media.photo) {
            const photo = addMessageRepairInfo(media.photo, context);
            addWebDocumentToLocalDb(photo);
        }
        if (media.extendedMedia instanceof GramJs.MessageExtendedMedia) {
            addMediaToLocalDb(media.extendedMedia.media, context);
        }
    }
    if (media instanceof GramJs.MessageMediaPaidMedia) {
        media.extendedMedia.forEach((extendedMedia) => {
            if (extendedMedia instanceof GramJs.MessageExtendedMedia) {
                addMediaToLocalDb(extendedMedia.media, context);
            }
        });
    }
}
export function addStoryToLocalDb(story, peerId) {
    if (!(story instanceof GramJs.StoryItem)) {
        return;
    }
    if (story.media instanceof GramJs.MessageMediaPhoto && story.media.photo) {
        const photo = addStoryRepairInfo(story.media.photo, peerId, story);
        addPhotoToLocalDb(photo);
    }
    if (story.media instanceof GramJs.MessageMediaDocument) {
        if (story.media.document instanceof GramJs.Document) {
            const doc = addStoryRepairInfo(story.media.document, peerId, story);
            addDocumentToLocalDb(doc);
        }
        if (story.media.altDocuments) {
            for (const altDocument of story.media.altDocuments) {
                const doc = addStoryRepairInfo(altDocument, peerId, story);
                addDocumentToLocalDb(doc);
            }
        }
    }
}
export function addPhotoToLocalDb(photo) {
    if (photo instanceof GramJs.Photo) {
        localDb.photos[String(photo.id)] = photo;
    }
}
export function addDocumentToLocalDb(document) {
    if (document instanceof GramJs.Document) {
        localDb.documents[String(document.id)] = document;
    }
}
export function addStoryRepairInfo(media, peerId, story) {
    if (!(media instanceof GramJs.Document || media instanceof GramJs.Photo))
        return media;
    const repairableMedia = media;
    repairableMedia.localRepairInfo = {
        type: 'story',
        peerId,
        id: story.id,
    };
    return repairableMedia;
}
export function addMessageRepairInfo(media, context) {
    if (!context?.peerId)
        return media;
    if (!(media instanceof GramJs.Document || media instanceof GramJs.Photo || media instanceof GramJs.WebDocument)) {
        return media;
    }
    const repairableMedia = media;
    repairableMedia.localRepairInfo = {
        type: 'message',
        peerId: getApiChatIdFromMtpPeer(context.peerId),
        id: context.id,
    };
    return repairableMedia;
}
export function addChatToLocalDb(chat) {
    const id = buildApiPeerId(chat.id, chat instanceof GramJs.Chat ? 'chat' : 'channel');
    const storedChat = localDb.chats[id];
    const isStoredMin = storedChat && 'min' in storedChat && storedChat.min;
    const isChatMin = 'min' in chat && chat.min;
    if (storedChat && !isStoredMin && isChatMin)
        return;
    localDb.chats[id] = chat;
}
export function addUserToLocalDb(user) {
    if (user instanceof GramJs.UserEmpty)
        return;
    const id = buildApiPeerId(user.id, 'user');
    const storedUser = localDb.users[id];
    if (user.photo instanceof GramJs.Photo) {
        addPhotoToLocalDb(user.photo);
    }
    if (storedUser && !storedUser.min && user.min)
        return;
    localDb.users[id] = user;
}
export function addWebDocumentToLocalDb(webDocument) {
    localDb.webDocuments[webDocument.url] = webDocument;
}
