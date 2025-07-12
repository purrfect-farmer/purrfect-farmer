import { memo, useRef, useState } from '../../../lib/teact/teact';
import { getActions } from '../../../global';
import { EDITABLE_INPUT_CSS_SELECTOR, EDITABLE_INPUT_MODAL_CSS_SELECTOR } from '../../../config';
import buildClassName from '../../../util/buildClassName';
import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';
import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
import ResponsiveHoverButton from '../../ui/ResponsiveHoverButton';
import Spinner from '../../ui/Spinner';
import SymbolMenu from './SymbolMenu.async';
const MOBILE_KEYBOARD_HIDE_DELAY_MS = 100;
const SymbolMenuButton = ({ chatId, threadId, isMobile, canSendGifs, canSendStickers, isMessageComposer, isReady, isSymbolMenuOpen, idPrefix, isAttachmentModal, canSendPlainText, isSymbolMenuForced, className, forceDarkTheme, inputCssSelector = EDITABLE_INPUT_CSS_SELECTOR, openSymbolMenu, closeSymbolMenu, onCustomEmojiSelect, onStickerSelect, onGifSelect, onRemoveSymbol, onEmojiSelect, closeBotCommandMenu, closeSendAsMenu, }) => {
    const { setStickerSearchQuery, setGifSearchQuery, addRecentEmoji, addRecentCustomEmoji, } = getActions();
    const triggerRef = useRef();
    const [isSymbolMenuLoaded, onSymbolMenuLoadingComplete] = useFlag();
    const [contextMenuAnchor, setContextMenuAnchor] = useState(undefined);
    const symbolMenuButtonClassName = buildClassName('composer-action-button mobile-symbol-menu-button', !isReady && 'not-ready', isSymbolMenuLoaded
        ? (isSymbolMenuOpen && 'menu-opened')
        : (isSymbolMenuOpen && 'is-loading'));
    const handleActivateSymbolMenu = useLastCallback(() => {
        closeBotCommandMenu?.();
        closeSendAsMenu?.();
        openSymbolMenu();
        const triggerEl = triggerRef.current;
        if (!triggerEl)
            return;
        const { x, y } = triggerEl.getBoundingClientRect();
        setContextMenuAnchor({ x, y });
    });
    const handleSearchOpen = useLastCallback((type) => {
        if (type === 'stickers') {
            setStickerSearchQuery({ query: '' });
            setGifSearchQuery({ query: undefined });
        }
        else {
            setGifSearchQuery({ query: '' });
            setStickerSearchQuery({ query: undefined });
        }
    });
    const handleSymbolMenuOpen = useLastCallback(() => {
        const messageInput = document.querySelector(isAttachmentModal ? EDITABLE_INPUT_MODAL_CSS_SELECTOR : inputCssSelector);
        if (!isMobile || messageInput !== document.activeElement) {
            openSymbolMenu();
            return;
        }
        messageInput?.blur();
        setTimeout(() => {
            closeBotCommandMenu?.();
            openSymbolMenu();
        }, MOBILE_KEYBOARD_HIDE_DELAY_MS);
    });
    const getTriggerElement = useLastCallback(() => triggerRef.current);
    const getRootElement = useLastCallback(() => triggerRef.current?.closest('.custom-scroll, .no-scrollbar'));
    const getMenuElement = useLastCallback(() => document.querySelector('#portals .SymbolMenu .bubble'));
    const getLayout = useLastCallback(() => ({ withPortal: true }));
    return (<>
      {isMobile ? (<Button className={symbolMenuButtonClassName} round color="translucent" onClick={isSymbolMenuOpen ? closeSymbolMenu : handleSymbolMenuOpen} ariaLabel="Choose emoji, sticker or GIF">
          <Icon name="smile"/>
          <Icon name="keyboard"/>
          {isSymbolMenuOpen && !isSymbolMenuLoaded && <Spinner color="gray"/>}
        </Button>) : (<ResponsiveHoverButton className={buildClassName('composer-action-button symbol-menu-button', isSymbolMenuOpen && 'activated')} round color="translucent" onActivate={handleActivateSymbolMenu} ariaLabel="Choose emoji, sticker or GIF">
          <div ref={triggerRef} className="symbol-menu-trigger"/>
          <Icon name="smile"/>
        </ResponsiveHoverButton>)}

      <SymbolMenu chatId={chatId} threadId={threadId} isOpen={isSymbolMenuOpen || Boolean(isSymbolMenuForced)} canSendGifs={canSendGifs} canSendStickers={canSendStickers} isMessageComposer={isMessageComposer} idPrefix={idPrefix} onLoad={onSymbolMenuLoadingComplete} onClose={closeSymbolMenu} onEmojiSelect={onEmojiSelect} onStickerSelect={onStickerSelect} onCustomEmojiSelect={onCustomEmojiSelect} onGifSelect={onGifSelect} onRemoveSymbol={onRemoveSymbol} onSearchOpen={handleSearchOpen} addRecentEmoji={addRecentEmoji} addRecentCustomEmoji={addRecentCustomEmoji} isAttachmentModal={isAttachmentModal} canSendPlainText={canSendPlainText} className={buildClassName(className, forceDarkTheme && 'component-theme-dark')} anchor={isAttachmentModal ? contextMenuAnchor : undefined} getTriggerElement={isAttachmentModal ? getTriggerElement : undefined} getRootElement={isAttachmentModal ? getRootElement : undefined} getMenuElement={isAttachmentModal ? getMenuElement : undefined} getLayout={isAttachmentModal ? getLayout : undefined}/>
    </>);
};
export default memo(SymbolMenuButton);
