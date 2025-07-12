import { ApiMediaFormat } from '../../../../api/types';
import { getMessageContact, getMessageHtmlId, getMessagePhoto, getMessageText, getMessageWebPagePhoto, getMessageWebPageVideo, getPhotoMediaHash, hasMediaLocalBlobUrl, } from '../../../../global/helpers';
import { getMessageTextWithSpoilers } from '../../../../global/helpers/messageSummary';
import { IS_SAFARI } from '../../../../util/browser/windowEnvironment';
import { CLIPBOARD_ITEM_SUPPORTED, copyHtmlToClipboard, copyImageToClipboard, copyTextToClipboard, } from '../../../../util/clipboard';
import getMessageIdsForSelectedText from '../../../../util/getMessageIdsForSelectedText';
import * as mediaLoader from '../../../../util/mediaLoader';
import { renderMessageText } from '../../../common/helpers/renderMessageText';
export function getMessageCopyOptions(message, statefulContent, href, canCopy, afterEffect, onCopyLink, onCopyMessages, onCopyNumber) {
    const options = [];
    const text = getMessageText(message);
    const photo = getMessagePhoto(message)
        || (!getMessageWebPageVideo(message) ? getMessageWebPagePhoto(message) : undefined);
    const contact = getMessageContact(message);
    const mediaHash = photo ? getPhotoMediaHash(photo, 'full') : undefined;
    const canImageBeCopied = canCopy && photo && (mediaHash || hasMediaLocalBlobUrl(photo))
        && CLIPBOARD_ITEM_SUPPORTED && !IS_SAFARI;
    const selection = window.getSelection();
    if (canImageBeCopied) {
        options.push({
            label: 'lng_context_copy_image',
            icon: 'copy-media',
            handler: () => {
                Promise.resolve(mediaHash ? mediaLoader.fetch(mediaHash, ApiMediaFormat.BlobUrl) : photo.blobUrl)
                    .then(copyImageToClipboard);
                afterEffect?.();
            },
        });
    }
    if (canCopy && href) {
        options.push({
            label: 'lng_context_copy_link',
            icon: 'copy',
            handler: () => {
                copyTextToClipboard(href);
                afterEffect?.();
            },
        });
    }
    else if (canCopy && text) {
        // Detect if the user has selection in the current message
        const hasSelection = Boolean((selection?.anchorNode?.parentNode
            && selection.anchorNode.parentNode.closest('.Message .content-inner')
            && selection.toString().replace(/(?:\r\n|\r|\n)/g, '') !== ''
            && checkMessageHasSelection(message)));
        options.push({
            label: getCopyLabel(hasSelection),
            icon: 'copy',
            handler: () => {
                const messageIds = getMessageIdsForSelectedText();
                if (messageIds?.length && onCopyMessages) {
                    onCopyMessages(messageIds);
                }
                else if (hasSelection) {
                    document.execCommand('copy');
                }
                else {
                    const clipboardText = renderMessageText({ message, shouldRenderAsHtml: true });
                    if (clipboardText) {
                        copyHtmlToClipboard(clipboardText.join(''), getMessageTextWithSpoilers(message, statefulContent));
                    }
                }
                afterEffect?.();
            },
        });
    }
    if (onCopyLink) {
        options.push({
            label: 'lng_context_copy_message_link',
            icon: 'link',
            handler: onCopyLink,
        });
    }
    if (contact && onCopyNumber) {
        options.push({
            label: 'lng_profile_copy_phone',
            icon: 'copy',
            handler: () => {
                onCopyNumber();
                afterEffect?.();
            },
        });
    }
    return options;
}
function checkMessageHasSelection(message) {
    const selection = window.getSelection();
    const selectionParentNode = selection?.anchorNode?.parentNode;
    const selectedMessageElement = selectionParentNode?.closest('.Message.message-list-item');
    return getMessageHtmlId(message.id) === selectedMessageElement?.id;
}
function getCopyLabel(hasSelection) {
    if (hasSelection) {
        return 'lng_context_copy_selected';
    }
    return 'lng_context_copy_text';
}
