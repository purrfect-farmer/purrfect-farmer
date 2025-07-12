import { memo, useEffect, useMemo, useRef, } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { CHAT_STICKER_SET_ID, EFFECT_EMOJIS_SET_ID, EFFECT_STICKERS_SET_ID, FAVORITE_SYMBOL_SET_ID, RECENT_SYMBOL_SET_ID, SLIDE_TRANSITION_DURATION, STICKER_PICKER_MAX_SHARED_COVERS, STICKER_SIZE_PICKER_HEADER, } from '../../../config';
import { selectChat, selectChatFullInfo, selectIsChatWithSelf, selectIsCurrentUserPremium, selectShouldLoopStickers, } from '../../../global/selectors';
import animateHorizontalScroll from '../../../util/animateHorizontalScroll';
import { IS_TOUCH_ENV } from '../../../util/browser/windowEnvironment';
import buildClassName from '../../../util/buildClassName';
import { isUserId } from '../../../util/entities/ids';
import { pickTruthy } from '../../../util/iteratees';
import { MEMO_EMPTY_ARRAY } from '../../../util/memo';
import { REM } from '../../common/helpers/mediaDimensions';
import useHorizontalScroll from '../../../hooks/useHorizontalScroll';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import useScrolledState from '../../../hooks/useScrolledState';
import useSendMessageAction from '../../../hooks/useSendMessageAction';
import { useStickerPickerObservers } from '../../common/hooks/useStickerPickerObservers';
import useAsyncRendering from '../../right/hooks/useAsyncRendering';
import Avatar from '../../common/Avatar';
import Icon from '../../common/icons/Icon';
import StickerButton from '../../common/StickerButton';
import StickerSet from '../../common/StickerSet';
import Button from '../../ui/Button';
import Loading from '../../ui/Loading';
import StickerSetCover from './StickerSetCover';
import styles from './StickerPicker.module.scss';
const HEADER_BUTTON_WIDTH = 2.5 * REM; // px (including margin)
const StickerPicker = ({ chat, threadId, className, isHidden, isTranslucent, loadAndPlay, canSendStickers, recentStickers, favoriteStickers, effectStickers, effectEmojis, addedSetIds, stickerSetsById, chatStickerSetId, canAnimate, isSavedMessages, isCurrentUserPremium, noContextMenus, idPrefix, onStickerSelect, isForEffects, }) => {
    const { loadRecentStickers, addRecentSticker, unfaveSticker, faveSticker, removeRecentSticker, } = getActions();
    const containerRef = useRef();
    const headerRef = useRef();
    const sharedCanvasRef = useRef();
    const { handleScroll: handleContentScroll, isAtBeginning: shouldHideTopBorder, } = useScrolledState();
    const sendMessageAction = useSendMessageAction(chat?.id, threadId);
    const prefix = `${idPrefix}-sticker-set`;
    const { activeSetIndex, observeIntersectionForSet, observeIntersectionForPlayingItems, observeIntersectionForShowingItems, observeIntersectionForCovers, selectStickerSet, } = useStickerPickerObservers(containerRef, headerRef, prefix, isHidden);
    const lang = useOldLang();
    const areAddedLoaded = Boolean(addedSetIds);
    const allSets = useMemo(() => {
        if (isForEffects && effectStickers) {
            const effectSets = [];
            if (effectEmojis?.length) {
                effectSets.push({
                    id: EFFECT_EMOJIS_SET_ID,
                    accessHash: '0',
                    title: '',
                    stickers: effectEmojis,
                    count: effectEmojis.length,
                    isEmoji: true,
                });
            }
            if (effectStickers?.length) {
                effectSets.push({
                    id: EFFECT_STICKERS_SET_ID,
                    accessHash: '0',
                    title: lang('StickerEffects'),
                    stickers: effectStickers,
                    count: effectStickers.length,
                });
            }
            return effectSets;
        }
        if (!addedSetIds) {
            return MEMO_EMPTY_ARRAY;
        }
        const defaultSets = [];
        if (favoriteStickers.length) {
            defaultSets.push({
                id: FAVORITE_SYMBOL_SET_ID,
                accessHash: '0',
                title: lang('FavoriteStickers'),
                stickers: favoriteStickers,
                count: favoriteStickers.length,
            });
        }
        if (recentStickers.length) {
            defaultSets.push({
                id: RECENT_SYMBOL_SET_ID,
                accessHash: '0',
                title: lang('RecentStickers'),
                stickers: recentStickers,
                count: recentStickers.length,
            });
        }
        const userSetIds = [...(addedSetIds || [])];
        if (chatStickerSetId) {
            userSetIds.unshift(chatStickerSetId);
        }
        const existingAddedSetIds = Object.values(pickTruthy(stickerSetsById, userSetIds));
        return [
            ...defaultSets,
            ...existingAddedSetIds,
        ];
    }, [
        addedSetIds,
        stickerSetsById,
        favoriteStickers,
        recentStickers,
        chatStickerSetId,
        lang,
        effectStickers,
        isForEffects,
        effectEmojis,
    ]);
    const noPopulatedSets = useMemo(() => (areAddedLoaded
        && allSets.filter((set) => set.stickers?.length).length === 0), [allSets, areAddedLoaded]);
    useEffect(() => {
        if (!loadAndPlay)
            return;
        loadRecentStickers();
        if (!canSendStickers)
            return;
        sendMessageAction({ type: 'chooseSticker' });
    }, [canSendStickers, loadAndPlay, loadRecentStickers, sendMessageAction]);
    const canRenderContents = useAsyncRendering([], SLIDE_TRANSITION_DURATION);
    const shouldRenderContents = areAddedLoaded && canRenderContents
        && !noPopulatedSets && (canSendStickers || isForEffects);
    useHorizontalScroll(headerRef, !shouldRenderContents || !headerRef.current);
    // Scroll container and header when active set changes
    useEffect(() => {
        if (!areAddedLoaded) {
            return;
        }
        const header = headerRef.current;
        if (!header) {
            return;
        }
        const newLeft = activeSetIndex * HEADER_BUTTON_WIDTH - (header.offsetWidth / 2 - HEADER_BUTTON_WIDTH / 2);
        animateHorizontalScroll(header, newLeft);
    }, [areAddedLoaded, activeSetIndex]);
    const handleStickerSelect = useLastCallback((sticker, isSilent, shouldSchedule) => {
        onStickerSelect(sticker, isSilent, shouldSchedule, true);
        addRecentSticker({ sticker });
    });
    const handleStickerUnfave = useLastCallback((sticker) => {
        unfaveSticker({ sticker });
    });
    const handleStickerFave = useLastCallback((sticker) => {
        faveSticker({ sticker });
    });
    const handleMouseMove = useLastCallback(() => {
        if (!canSendStickers)
            return;
        sendMessageAction({ type: 'chooseSticker' });
    });
    const handleRemoveRecentSticker = useLastCallback((sticker) => {
        removeRecentSticker({ sticker });
    });
    if (!chat)
        return undefined;
    function renderCover(stickerSet, index) {
        const firstSticker = stickerSet.stickers?.[0];
        const buttonClassName = buildClassName(styles.stickerCover, index === activeSetIndex && styles.activated);
        const withSharedCanvas = index < STICKER_PICKER_MAX_SHARED_COVERS;
        if (stickerSet.id === RECENT_SYMBOL_SET_ID
            || stickerSet.id === FAVORITE_SYMBOL_SET_ID
            || stickerSet.id === CHAT_STICKER_SET_ID
            || stickerSet.hasThumbnail
            || !firstSticker) {
            return (<Button key={stickerSet.id} className={buttonClassName} ariaLabel={stickerSet.title} round faded={stickerSet.id === RECENT_SYMBOL_SET_ID || stickerSet.id === FAVORITE_SYMBOL_SET_ID} color="translucent" onClick={() => selectStickerSet(index)}>
          {stickerSet.id === RECENT_SYMBOL_SET_ID ? (<Icon name="recent"/>) : stickerSet.id === FAVORITE_SYMBOL_SET_ID ? (<Icon name="favorite"/>) : stickerSet.id === CHAT_STICKER_SET_ID ? (<Avatar peer={chat} size="small"/>) : (<StickerSetCover stickerSet={stickerSet} noPlay={!canAnimate || !loadAndPlay} observeIntersection={observeIntersectionForCovers} sharedCanvasRef={withSharedCanvas ? sharedCanvasRef : undefined} forcePlayback/>)}
        </Button>);
        }
        else {
            return (<StickerButton key={stickerSet.id} sticker={firstSticker} size={STICKER_SIZE_PICKER_HEADER} title={stickerSet.title} className={buttonClassName} noPlay={!canAnimate || !loadAndPlay} observeIntersection={observeIntersectionForCovers} noContextMenu isCurrentUserPremium sharedCanvasRef={withSharedCanvas ? sharedCanvasRef : undefined} withTranslucentThumb={isTranslucent} onClick={selectStickerSet} clickArg={index} forcePlayback/>);
        }
    }
    const fullClassName = buildClassName(styles.root, className);
    if (!shouldRenderContents) {
        return (<div className={fullClassName}>
        {!canSendStickers && !isForEffects ? (<div className={styles.pickerDisabled}>{lang('ErrorSendRestrictedStickersAll')}</div>) : noPopulatedSets ? (<div className={styles.pickerDisabled}>{lang('NoStickers')}</div>) : (<Loading />)}
      </div>);
    }
    const headerClassName = buildClassName(styles.header, 'no-scrollbar', !shouldHideTopBorder && styles.headerWithBorder);
    return (<div className={fullClassName}>
      {!isForEffects && (<div ref={headerRef} className={headerClassName}>
          <div className="shared-canvas-container">
            <canvas ref={sharedCanvasRef} className="shared-canvas"/>
            {allSets.map(renderCover)}
          </div>
        </div>)}
      <div ref={containerRef} onMouseMove={handleMouseMove} onScroll={handleContentScroll} className={buildClassName(styles.main, IS_TOUCH_ENV ? 'no-scrollbar' : 'custom-scroll', !isForEffects && styles.hasHeader)}>
        {allSets.map((stickerSet, i) => (<StickerSet key={stickerSet.id} stickerSet={stickerSet} loadAndPlay={Boolean(canAnimate && loadAndPlay)} noContextMenus={noContextMenus} index={i} idPrefix={prefix} observeIntersection={observeIntersectionForSet} observeIntersectionForPlayingItems={observeIntersectionForPlayingItems} observeIntersectionForShowingItems={observeIntersectionForShowingItems} isNearActive={activeSetIndex >= i - 1 && activeSetIndex <= i + 1} favoriteStickers={favoriteStickers} isSavedMessages={isSavedMessages} isCurrentUserPremium={isCurrentUserPremium} isTranslucent={isTranslucent} isChatStickerSet={stickerSet.id === chatStickerSetId} onStickerSelect={handleStickerSelect} onStickerUnfave={handleStickerUnfave} onStickerFave={handleStickerFave} onStickerRemoveRecent={handleRemoveRecentSticker} forcePlayback shouldHideHeader={stickerSet.id === EFFECT_EMOJIS_SET_ID}/>))}
      </div>
    </div>);
};
export default memo(withGlobal((global, { chatId }) => {
    const { setsById, added, recent, favorite, effect, } = global.stickers;
    const isSavedMessages = selectIsChatWithSelf(global, chatId);
    const chat = selectChat(global, chatId);
    const chatStickerSetId = !isUserId(chatId) ? selectChatFullInfo(global, chatId)?.stickerSet?.id : undefined;
    return {
        chat,
        effectStickers: effect?.stickers,
        effectEmojis: effect?.emojis,
        recentStickers: recent.stickers,
        favoriteStickers: favorite.stickers,
        stickerSetsById: setsById,
        addedSetIds: added.setIds,
        canAnimate: selectShouldLoopStickers(global),
        isSavedMessages,
        isCurrentUserPremium: selectIsCurrentUserPremium(global),
        chatStickerSetId,
    };
})(StickerPicker));
