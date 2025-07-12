import { memo, useMemo, useRef, } from '../../lib/teact/teact';
import { ApiMessageEntityTypes } from '../../api/types';
import { CONTENT_NOT_SUPPORTED } from '../../config';
import { extractMessageText, stripCustomEmoji } from '../../global/helpers';
import trimText from '../../util/trimText';
import { insertTextEntity, renderTextWithEntities } from './helpers/renderTextWithEntities';
import useSyncEffect from '../../hooks/useSyncEffect';
import useUniqueId from '../../hooks/useUniqueId';
const MIN_CUSTOM_EMOJIS_FOR_SHARED_CANVAS = 3;
function MessageText({ messageOrStory, translatedText, isForAnimation, emojiSize, highlight, asPreview, truncateLength, isProtected, observeIntersectionForLoading, observeIntersectionForPlaying, withTranslucentThumbs, shouldRenderAsHtml, inChatList, forcePlayback, focusedQuote, focusedQuoteOffset, isInSelectMode, canBeEmpty, maxTimestamp, threadId, }) {
    const sharedCanvasRef = useRef();
    const sharedCanvasHqRef = useRef();
    const textCacheBusterRef = useRef(0);
    const formattedText = translatedText || extractMessageText(messageOrStory, inChatList);
    const adaptedFormattedText = isForAnimation && formattedText ? stripCustomEmoji(formattedText) : formattedText;
    const { text, entities } = adaptedFormattedText || {};
    const entitiesWithFocusedQuote = useMemo(() => {
        if (!text || !focusedQuote)
            return entities;
        const offsetIndex = text.indexOf(focusedQuote, focusedQuoteOffset);
        const index = offsetIndex >= 0 ? offsetIndex : text.indexOf(focusedQuote); // Fallback to first occurrence
        const lendth = focusedQuote.length;
        if (index >= 0) {
            return insertTextEntity(entities || [], {
                offset: index,
                length: lendth,
                type: ApiMessageEntityTypes.QuoteFocus,
            });
        }
        return entities;
    }, [text, entities, focusedQuote, focusedQuoteOffset]);
    const containerId = useUniqueId();
    useSyncEffect(() => {
        textCacheBusterRef.current += 1;
    }, [text, entitiesWithFocusedQuote]);
    const withSharedCanvas = useMemo(() => {
        const hasSpoilers = entitiesWithFocusedQuote?.some((e) => e.type === ApiMessageEntityTypes.Spoiler);
        if (hasSpoilers) {
            return false;
        }
        const customEmojisCount = entitiesWithFocusedQuote
            ?.filter((e) => e.type === ApiMessageEntityTypes.CustomEmoji).length || 0;
        return customEmojisCount >= MIN_CUSTOM_EMOJIS_FOR_SHARED_CANVAS;
    }, [entitiesWithFocusedQuote]) || 0;
    if (!text && !canBeEmpty) {
        return <span className="content-unsupported">{CONTENT_NOT_SUPPORTED}</span>;
    }
    return (<>
      {[
            withSharedCanvas && <canvas ref={sharedCanvasRef} className="shared-canvas"/>,
            withSharedCanvas && <canvas ref={sharedCanvasHqRef} className="shared-canvas"/>,
            renderTextWithEntities({
                text: trimText(text, truncateLength),
                entities: entitiesWithFocusedQuote,
                highlight,
                emojiSize,
                shouldRenderAsHtml,
                containerId,
                asPreview,
                isProtected,
                observeIntersectionForLoading,
                observeIntersectionForPlaying,
                withTranslucentThumbs,
                sharedCanvasRef,
                sharedCanvasHqRef,
                cacheBuster: textCacheBusterRef.current.toString(),
                forcePlayback,
                isInSelectMode,
                maxTimestamp,
                chatId: 'chatId' in messageOrStory ? messageOrStory.chatId : undefined,
                messageId: messageOrStory.id,
                threadId,
            }),
        ].flat().filter(Boolean)}
    </>);
}
export default memo(MessageText);
