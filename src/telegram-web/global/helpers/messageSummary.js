import { ApiMessageEntityTypes } from '../../api/types';
import { CONTENT_NOT_SUPPORTED } from '../../config';
import trimText from '../../util/trimText';
import { renderTextWithEntities } from '../../components/common/helpers/renderTextWithEntities';
import { getMessageText, getMessageTranscription, } from './messages';
const SPOILER_CHARS = ['⠺', '⠵', '⠞', '⠟'];
export const TRUNCATED_SUMMARY_LENGTH = 80;
export function getMessageSummaryText(lang, message, statefulContent, noEmoji = false, truncateLength = TRUNCATED_SUMMARY_LENGTH, isExtended = false) {
    const emoji = !noEmoji && getMessageSummaryEmoji(message);
    const emojiWithSpace = emoji ? `${emoji} ` : '';
    const text = trimText(getMessageTextWithSpoilers(message, statefulContent), truncateLength);
    const description = getMessageSummaryDescription(lang, message, statefulContent, text, isExtended);
    return `${emojiWithSpace}${description}`;
}
export function getMessageTextWithSpoilers(message, statefulContent) {
    const transcription = getMessageTranscription(message);
    const textWithoutTranscription = getMessageText(statefulContent?.story || message)?.text;
    if (!textWithoutTranscription) {
        return transcription;
    }
    const { entities } = message.content.text || {};
    if (!entities?.length) {
        return transcription ? `${transcription}\n${textWithoutTranscription}` : textWithoutTranscription;
    }
    const text = entities.reduce((accText, { type, offset, length, }) => {
        if (type !== ApiMessageEntityTypes.Spoiler) {
            return accText;
        }
        const spoiler = generateBrailleSpoiler(length);
        return `${accText.substr(0, offset)}${spoiler}${accText.substr(offset + length, accText.length)}`;
    }, textWithoutTranscription);
    return transcription ? `${transcription}\n${text}` : text;
}
export function getMessageSummaryEmoji(message) {
    const { photo, video, audio, voice, document, sticker, pollId, paidMedia, todo, } = message.content;
    if (message.groupedId || photo || paidMedia) {
        return '🖼';
    }
    if (video) {
        return '📹';
    }
    if (sticker) {
        return sticker.emoji;
    }
    if (audio) {
        return '🎧';
    }
    if (voice) {
        return '🎤';
    }
    if (document) {
        return '📎';
    }
    if (pollId) {
        return '📊';
    }
    if (todo) {
        return '📝';
    }
    return undefined;
}
export function getMediaContentTypeDescription(lang, content, statefulContent) {
    return getSummaryDescription(lang, content, statefulContent);
}
export function getMessageSummaryDescription(lang, message, statefulContent, truncatedText, isExtended = false) {
    return getSummaryDescription(lang, message.content, statefulContent, message, truncatedText, isExtended);
}
function getSummaryDescription(lang, mediaContent, statefulContent, message, truncatedText, isExtended = false) {
    const { text, photo, video, audio, voice, document, sticker, contact, invoice, location, game, storyData, giveaway, giveawayResults, paidMedia, todo, } = mediaContent;
    const { poll } = statefulContent || {};
    let hasUsedTruncatedText = false;
    let summary;
    const boughtExtendedMedia = paidMedia?.isBought && paidMedia.extendedMedia;
    const previewExtendedMedia = paidMedia && !paidMedia.isBought
        ? paidMedia.extendedMedia : undefined;
    const isPaidMediaAlbum = paidMedia && paidMedia.extendedMedia.length > 1;
    const isPaidMediaSingleVideo = !isPaidMediaAlbum
        && (boughtExtendedMedia?.[0].video || previewExtendedMedia?.[0].duration);
    const isPaidMediaSinglePhoto = !isPaidMediaAlbum && !isPaidMediaSingleVideo;
    if (message?.groupedId || isPaidMediaAlbum) {
        hasUsedTruncatedText = true;
        summary = truncatedText || lang('lng_in_dlg_album');
    }
    if (photo || isPaidMediaSinglePhoto) {
        hasUsedTruncatedText = true;
        summary = truncatedText || lang('AttachPhoto');
    }
    if (video || isPaidMediaSingleVideo) {
        hasUsedTruncatedText = true;
        summary = truncatedText || lang(video?.isGif ? 'AttachGif' : 'AttachVideo');
    }
    if (sticker) {
        summary = lang('AttachSticker').trim();
    }
    if (audio) {
        summary = getMessageAudioCaption(mediaContent) || lang('AttachMusic');
    }
    if (voice) {
        hasUsedTruncatedText = true;
        summary = truncatedText || lang('AttachAudio');
    }
    if (document) {
        hasUsedTruncatedText = !isExtended;
        summary = isExtended ? document.fileName : (truncatedText || document.fileName);
    }
    if (contact) {
        summary = lang('AttachContact');
    }
    if (poll) {
        summary = renderTextWithEntities({
            text: poll.summary.question.text,
            entities: poll.summary.question.entities,
            asPreview: true,
        });
    }
    if (invoice) {
        summary = invoice.extendedMedia ? invoice.title : `${lang('PaymentInvoice')}: ${invoice.description}`;
    }
    if (text) {
        if (isExtended && summary && !hasUsedTruncatedText) {
            summary += `\n${truncatedText}`;
        }
        else {
            summary = truncatedText;
        }
    }
    if (location?.mediaType === 'geo' || location?.mediaType === 'venue') {
        summary = lang('Message.Location');
    }
    if (location?.mediaType === 'geoLive') {
        summary = lang('Message.LiveLocation');
    }
    if (game) {
        summary = `🎮 ${game.title}`;
    }
    if (giveaway) {
        summary = lang('BoostingGiveawayChannelStarted');
    }
    if (giveawayResults) {
        summary = lang('Message.GiveawayEndedWinners', giveawayResults.winnersCount);
    }
    if (storyData) {
        summary = truncatedText || (message ? lang('ForwardedStory') : lang('Chat.ReplyStory'));
    }
    if (todo) {
        summary = lang('Chat.Todo.Message.Title');
    }
    return summary || CONTENT_NOT_SUPPORTED;
}
export function generateBrailleSpoiler(length) {
    return new Array(length)
        .fill(undefined)
        .map(() => SPOILER_CHARS[Math.floor(Math.random() * SPOILER_CHARS.length)])
        .join('');
}
function getMessageAudioCaption(mediaContent) {
    const { audio, text, } = mediaContent;
    return (audio && [audio.title, audio.performer].filter(Boolean)
        .join(' — ')) || (text?.text);
}
