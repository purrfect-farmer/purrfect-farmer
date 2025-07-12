import { memo } from '../../../lib/teact/teact';
import buildClassName from '../../../util/buildClassName';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
export var SymbolMenuTabs;
(function (SymbolMenuTabs) {
    SymbolMenuTabs[SymbolMenuTabs["Emoji"] = 0] = "Emoji";
    SymbolMenuTabs[SymbolMenuTabs["CustomEmoji"] = 1] = "CustomEmoji";
    SymbolMenuTabs[SymbolMenuTabs["Stickers"] = 2] = "Stickers";
    SymbolMenuTabs[SymbolMenuTabs["GIFs"] = 3] = "GIFs";
})(SymbolMenuTabs || (SymbolMenuTabs = {}));
export const SYMBOL_MENU_TAB_TITLES = {
    [SymbolMenuTabs.Emoji]: 'Emoji',
    [SymbolMenuTabs.CustomEmoji]: 'StickersList.EmojiItem',
    [SymbolMenuTabs.Stickers]: 'AccDescrStickers',
    [SymbolMenuTabs.GIFs]: 'GifsTab',
};
const SYMBOL_MENU_TAB_ICONS = {
    [SymbolMenuTabs.Emoji]: 'icon-smile',
    [SymbolMenuTabs.CustomEmoji]: 'icon-favorite',
    [SymbolMenuTabs.Stickers]: 'icon-stickers',
    [SymbolMenuTabs.GIFs]: 'icon-gifs',
};
const SymbolMenuFooter = ({ activeTab, onSwitchTab, onRemoveSymbol, onSearchOpen, isAttachmentModal, canSendPlainText, canSearch, }) => {
    const lang = useOldLang();
    function renderTabButton(tab) {
        return (<Button className={`symbol-tab-button ${activeTab === tab ? 'activated' : ''}`} onClick={() => onSwitchTab(tab)} ariaLabel={lang(SYMBOL_MENU_TAB_TITLES[tab])} round faded color="translucent">
        <i className={buildClassName('icon', SYMBOL_MENU_TAB_ICONS[tab])}/>
      </Button>);
    }
    const handleSearchOpen = useLastCallback(() => {
        onSearchOpen(activeTab === SymbolMenuTabs.Stickers ? 'stickers' : 'gifs');
    });
    function stopPropagation(event) {
        event.stopPropagation();
    }
    return (<div className="SymbolMenu-footer" onClick={stopPropagation} dir={lang.isRtl ? 'rtl' : undefined}>
      {activeTab !== SymbolMenuTabs.Emoji && activeTab !== SymbolMenuTabs.CustomEmoji && canSearch && (<Button className="symbol-search-button" ariaLabel={activeTab === SymbolMenuTabs.Stickers ? 'Search Stickers' : 'Search GIFs'} round faded color="translucent" onClick={handleSearchOpen}>
          <Icon name="search"/>
        </Button>)}

      {canSendPlainText && renderTabButton(SymbolMenuTabs.Emoji)}
      {canSendPlainText && renderTabButton(SymbolMenuTabs.CustomEmoji)}
      {!isAttachmentModal && renderTabButton(SymbolMenuTabs.Stickers)}
      {!isAttachmentModal && renderTabButton(SymbolMenuTabs.GIFs)}

      {(activeTab === SymbolMenuTabs.Emoji || activeTab === SymbolMenuTabs.CustomEmoji) && (<Button className="symbol-delete-button" onClick={onRemoveSymbol} ariaLabel="Remove Symbol" round faded color="translucent">
          <Icon name="delete-left"/>
        </Button>)}
    </div>);
};
export default memo(SymbolMenuFooter);
