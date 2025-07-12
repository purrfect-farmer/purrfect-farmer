import { memo, useEffect, useLayoutEffect, useRef, useState, } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';
import { requestMutation } from '../../../lib/fasterdom/fasterdom';
import { selectIsContextMenuTranslucent, selectTabState } from '../../../global/selectors';
import { IS_TOUCH_ENV } from '../../../util/browser/windowEnvironment';
import buildClassName from '../../../util/buildClassName';
import useAppLayout from '../../../hooks/useAppLayout';
import useLastCallback from '../../../hooks/useLastCallback';
import useMouseInside from '../../../hooks/useMouseInside';
import useOldLang from '../../../hooks/useOldLang';
import useShowTransitionDeprecated from '../../../hooks/useShowTransitionDeprecated';
import CustomEmojiPicker from '../../common/CustomEmojiPicker';
import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
import Menu from '../../ui/Menu';
import Portal from '../../ui/Portal';
import Transition from '../../ui/Transition';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import StickerPicker from './StickerPicker';
import SymbolMenuFooter, { SYMBOL_MENU_TAB_TITLES, SymbolMenuTabs } from './SymbolMenuFooter';
import './SymbolMenu.scss';
const ANIMATION_DURATION = 350;
const STICKERS_TAB_INDEX = 2;
let isActivated = false;
const SymbolMenu = ({ chatId, threadId, isOpen, canSendStickers, canSendGifs, isMessageComposer, isLeftColumnShown, idPrefix, isAttachmentModal, canSendPlainText, className, isBackgroundTranslucent, onLoad, onClose, onEmojiSelect, onCustomEmojiSelect, onStickerSelect, onGifSelect, onRemoveSymbol, onSearchOpen, addRecentEmoji, addRecentCustomEmoji, ...menuPositionOptions }) => {
    const [activeTab, setActiveTab] = useState(SymbolMenuTabs.Emoji);
    const [recentEmojis, setRecentEmojis] = useState([]);
    const [recentCustomEmojis, setRecentCustomEmojis] = useState([]);
    const { isMobile } = useAppLayout();
    const [handleMouseEnter, handleMouseLeave] = useMouseInside(isOpen, onClose, undefined, isMobile);
    const { shouldRender, transitionClassNames } = useShowTransitionDeprecated(isOpen, onClose, false, false);
    const lang = useOldLang();
    if (!isActivated && isOpen) {
        isActivated = true;
    }
    useEffect(() => {
        onLoad();
    }, [onLoad]);
    // If we can't send plain text, we should always show the stickers tab
    useEffect(() => {
        if (canSendPlainText)
            return;
        setActiveTab(STICKERS_TAB_INDEX);
    }, [canSendPlainText]);
    useLayoutEffect(() => {
        if (!isMobile || !isOpen || isAttachmentModal) {
            return undefined;
        }
        document.body.classList.add('enable-symbol-menu-transforms');
        document.body.classList.add('is-symbol-menu-open');
        return () => {
            document.body.classList.remove('is-symbol-menu-open');
            setTimeout(() => {
                requestMutation(() => {
                    document.body.classList.remove('enable-symbol-menu-transforms');
                });
            }, ANIMATION_DURATION);
        };
    }, [isAttachmentModal, isMobile, isOpen]);
    const recentEmojisRef = useRef(recentEmojis);
    recentEmojisRef.current = recentEmojis;
    useEffect(() => {
        if (!recentEmojisRef.current.length || isOpen) {
            return;
        }
        recentEmojisRef.current.forEach((name) => {
            addRecentEmoji({ emoji: name });
        });
        setRecentEmojis([]);
    }, [isOpen, addRecentEmoji]);
    const handleEmojiSelect = useLastCallback((emoji, name) => {
        setRecentEmojis((emojis) => [...emojis, name]);
        onEmojiSelect(emoji);
    });
    const recentCustomEmojisRef = useRef(recentCustomEmojis);
    recentCustomEmojisRef.current = recentCustomEmojis;
    useEffect(() => {
        if (!recentCustomEmojisRef.current.length || isOpen) {
            return;
        }
        recentCustomEmojisRef.current.forEach((documentId) => {
            addRecentCustomEmoji({
                documentId,
            });
        });
        setRecentEmojis([]);
    }, [isOpen, addRecentCustomEmoji]);
    const handleCustomEmojiSelect = useLastCallback((emoji) => {
        setRecentCustomEmojis((ids) => [...ids, emoji.id]);
        onCustomEmojiSelect(emoji);
    });
    const handleSearch = useLastCallback((type) => {
        onClose();
        onSearchOpen(type);
    });
    const handleStickerSelect = useLastCallback((sticker, isSilent, shouldSchedule, canUpdateStickerSetsOrder) => {
        onStickerSelect?.(sticker, isSilent, shouldSchedule, true, canUpdateStickerSetsOrder);
    });
    function renderContent(isActive, isFrom) {
        switch (activeTab) {
            case SymbolMenuTabs.Emoji:
                return (<EmojiPicker className="picker-tab" onEmojiSelect={handleEmojiSelect}/>);
            case SymbolMenuTabs.CustomEmoji:
                return (<CustomEmojiPicker className="picker-tab" isHidden={!isOpen || !isActive} idPrefix={idPrefix} loadAndPlay={isOpen && (isActive || isFrom)} chatId={chatId} isTranslucent={!isMobile && isBackgroundTranslucent} onCustomEmojiSelect={handleCustomEmojiSelect}/>);
            case SymbolMenuTabs.Stickers:
                return (<StickerPicker className="picker-tab" isHidden={!isOpen || !isActive} loadAndPlay={canSendStickers ? isOpen && (isActive || isFrom) : false} idPrefix={idPrefix} canSendStickers={canSendStickers} noContextMenus={!isMessageComposer} chatId={chatId} threadId={threadId} isTranslucent={!isMobile && isBackgroundTranslucent} onStickerSelect={handleStickerSelect}/>);
            case SymbolMenuTabs.GIFs:
                return (<GifPicker className="picker-tab" loadAndPlay={canSendGifs ? isOpen && (isActive || isFrom) : false} canSendGifs={canSendGifs} onGifSelect={onGifSelect}/>);
        }
        return undefined;
    }
    function stopPropagation(event) {
        event.stopPropagation();
    }
    const content = (<>
      <div className="SymbolMenu-main" onClick={stopPropagation}>
        {isActivated && (<Transition name="slide" activeKey={activeTab} renderCount={Object.values(SYMBOL_MENU_TAB_TITLES).length}>
            {renderContent}
          </Transition>)}
      </div>
      {isMobile && (<Button round faded color="translucent" ariaLabel={lang('Close')} className="symbol-close-button" size="tiny" onClick={onClose}>
          <Icon name="close"/>
        </Button>)}
      <SymbolMenuFooter activeTab={activeTab} onSwitchTab={setActiveTab} onRemoveSymbol={onRemoveSymbol} canSearch={isMessageComposer} onSearchOpen={handleSearch} isAttachmentModal={isAttachmentModal} canSendPlainText={canSendPlainText}/>
    </>);
    if (isMobile) {
        if (!shouldRender) {
            return undefined;
        }
        const mobileClassName = buildClassName('SymbolMenu mobile-menu', transitionClassNames, isLeftColumnShown && 'left-column-open', isAttachmentModal && 'in-attachment-modal', isMessageComposer && 'in-middle-column');
        if (isAttachmentModal) {
            return (<div className={mobileClassName}>
          {content}
        </div>);
        }
        return (<Portal>
        <div className={mobileClassName}>
          {content}
        </div>
      </Portal>);
    }
    return (<Menu isOpen={isOpen} onClose={onClose} withPortal={isAttachmentModal} className={buildClassName('SymbolMenu', className)} onCloseAnimationEnd={onClose} onMouseEnter={!IS_TOUCH_ENV ? handleMouseEnter : undefined} onMouseLeave={!IS_TOUCH_ENV ? handleMouseLeave : undefined} noCloseOnBackdrop={!IS_TOUCH_ENV} noCompact {...(isAttachmentModal ? menuPositionOptions : {
        positionX: 'left',
        positionY: 'bottom',
    })}>
      {content}
    </Menu>);
};
export default memo(withGlobal((global) => {
    return {
        isLeftColumnShown: selectTabState(global).isLeftColumnShown,
        isBackgroundTranslucent: selectIsContextMenuTranslucent(global),
    };
})(SymbolMenu));
