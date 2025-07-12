import { memo, useCallback } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { StoryViewerOrigin } from '../../../types';
import { getIsChatMuted } from '../../../global/helpers/notifications';
import { selectChat, selectIsChatPinned, selectNotifyDefaults, selectNotifyException, selectUser, } from '../../../global/selectors';
import { isUserId } from '../../../util/entities/ids';
import { extractCurrentThemeParams } from '../../../util/themeStyle';
import useChatContextActions from '../../../hooks/useChatContextActions';
import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import useSelectWithEnter from '../../../hooks/useSelectWithEnter';
import GroupChatInfo from '../../common/GroupChatInfo';
import PrivateChatInfo from '../../common/PrivateChatInfo';
import Button from '../../ui/Button';
import ListItem from '../../ui/ListItem';
import ChatFolderModal from '../ChatFolderModal.async';
import MuteChatModal from '../MuteChatModal.async';
const LeftSearchResultChat = ({ chatId, withUsername, chat, user, isPinned, isMuted, canChangeFolder, withOpenAppButton, onClick, }) => {
    const { requestMainWebView } = getActions();
    const oldLang = useOldLang();
    const [isMuteModalOpen, openMuteModal, closeMuteModal] = useFlag();
    const [isChatFolderModalOpen, openChatFolderModal, closeChatFolderModal] = useFlag();
    const [shouldRenderChatFolderModal, markRenderChatFolderModal, unmarkRenderChatFolderModal] = useFlag();
    const [shouldRenderMuteModal, markRenderMuteModal, unmarkRenderMuteModal] = useFlag();
    const handleChatFolderChange = useCallback(() => {
        markRenderChatFolderModal();
        openChatFolderModal();
    }, [markRenderChatFolderModal, openChatFolderModal]);
    const handleMute = useCallback(() => {
        markRenderMuteModal();
        openMuteModal();
    }, [markRenderMuteModal, openMuteModal]);
    const contextActions = useChatContextActions({
        chat,
        user,
        isPinned,
        isMuted,
        canChangeFolder,
        handleMute,
        handleChatFolderChange,
    }, true);
    const handleClick = useLastCallback(() => {
        onClick(chatId);
    });
    const handleOpenApp = useLastCallback((e) => {
        e.stopPropagation();
        const theme = extractCurrentThemeParams();
        requestMainWebView({
            botId: chatId,
            peerId: chatId,
            theme,
        });
    });
    const buttonRef = useSelectWithEnter(handleClick);
    return (<ListItem className="chat-item-clickable search-result" onClick={handleClick} contextActions={contextActions} buttonRef={buttonRef}>
      {isUserId(chatId) ? (<PrivateChatInfo userId={chatId} withUsername={withUsername} withStory avatarSize="medium" storyViewerOrigin={StoryViewerOrigin.SearchResult}/>) : (<GroupChatInfo chatId={chatId} withUsername={withUsername} avatarSize="medium" withStory storyViewerOrigin={StoryViewerOrigin.SearchResult}/>)}
      {withOpenAppButton && user?.hasMainMiniApp && (<Button className="ChatBadge miniapp" pill fluid size="tiny" onClick={handleOpenApp}>
          {oldLang('BotOpen')}
        </Button>)}
      {shouldRenderMuteModal && (<MuteChatModal isOpen={isMuteModalOpen} onClose={closeMuteModal} onCloseAnimationEnd={unmarkRenderMuteModal} chatId={chatId}/>)}
      {shouldRenderChatFolderModal && (<ChatFolderModal isOpen={isChatFolderModalOpen} onClose={closeChatFolderModal} onCloseAnimationEnd={unmarkRenderChatFolderModal} chatId={chatId}/>)}
    </ListItem>);
};
export default memo(withGlobal((global, { chatId }) => {
    const chat = selectChat(global, chatId);
    const user = selectUser(global, chatId);
    const isPinned = selectIsChatPinned(global, chatId);
    const isMuted = chat && getIsChatMuted(chat, selectNotifyDefaults(global), selectNotifyException(global, chat.id));
    return {
        chat,
        user,
        isPinned,
        isMuted,
        canChangeFolder: Boolean(global.chatFolders.orderedIds?.length),
    };
})(LeftSearchResultChat));
