import { memo, useRef } from '../../../lib/teact/teact';
import { getActions } from '../../../global';
import { StoryViewerOrigin } from '../../../types';
import { isUserId } from '../../../util/entities/ids';
import useContextMenuHandlers from '../../../hooks/useContextMenuHandlers';
import { useFastClick } from '../../../hooks/useFastClick';
import { useOnIntersect } from '../../../hooks/useIntersectionObserver';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';
import useSelectWithEnter from '../../../hooks/useSelectWithEnter';
import BadgeButton from '../../common/BadgeButton';
import GroupChatInfo from '../../common/GroupChatInfo';
import Icon from '../../common/icons/Icon';
import PrivateChatInfo from '../../common/PrivateChatInfo';
import SponsoredMessageContextMenuContainer from '../../middle/message/SponsoredContextMenuContainer';
import ListItem from '../../ui/ListItem';
const LeftSearchResultSponsored = ({ sponsoredPeer, observeIntersection, }) => {
    const ref = useRef();
    const { clickSponsored, viewSponsored, openChat } = getActions();
    const lang = useLang();
    const { peerId, randomId, additionalInfo, sponsorInfo, } = sponsoredPeer;
    useOnIntersect(ref, observeIntersection, (entry) => {
        if (entry.intersectionRatio === 1) {
            viewSponsored({ randomId });
        }
    });
    const handleClick = useLastCallback(() => {
        clickSponsored({ randomId });
        openChat({ id: peerId });
    });
    const { isContextMenuOpen, contextMenuAnchor, handleBeforeContextMenu, handleContextMenu, handleContextMenuClose, handleContextMenuHide, } = useContextMenuHandlers(ref);
    const { handleClick: handleBadgeClick, handleMouseDown: handleBadgeMouseDown, } = useFastClick((e) => {
        e.stopPropagation();
        handleContextMenu(e);
    });
    const buttonRef = useSelectWithEnter(handleClick);
    return (<ListItem ref={ref} className="chat-item-clickable search-result" onClick={handleClick} onMouseDown={handleBeforeContextMenu} onContextMenu={handleContextMenu} buttonRef={buttonRef}>
      {isUserId(peerId) ? (<PrivateChatInfo userId={peerId} withUsername withStory avatarSize="medium" storyViewerOrigin={StoryViewerOrigin.SearchResult}/>) : (<GroupChatInfo chatId={peerId} withUsername avatarSize="medium" withStory storyViewerOrigin={StoryViewerOrigin.SearchResult}/>)}
      <BadgeButton className="search-sponsored-badge" onMouseDown={handleBadgeMouseDown} onClick={handleBadgeClick}>
        {lang('SponsoredPeerBadge')}
        <Icon name="more"/>
      </BadgeButton>
      {contextMenuAnchor && (<SponsoredMessageContextMenuContainer isOpen={isContextMenuOpen} anchor={contextMenuAnchor} triggerRef={ref} randomId={randomId} additionalInfo={additionalInfo} canReport sponsorInfo={sponsorInfo} onClose={handleContextMenuClose} onCloseAnimationEnd={handleContextMenuHide}/>)}
    </ListItem>);
};
export default memo(LeftSearchResultSponsored);
