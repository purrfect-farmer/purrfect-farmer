import { memo, useEffect, useMemo } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';
import { MediaViewerOrigin } from '../../types';
import { getMainUsername, getUserStatus, isSystemBot, isUserOnline, } from '../../global/helpers';
import { selectChatMessages, selectUser, selectUserStatus } from '../../global/selectors';
import buildClassName from '../../util/buildClassName';
import renderText from './helpers/renderText';
import useIntervalForceUpdate from '../../hooks/schedulers/useIntervalForceUpdate';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
import RippleEffect from '../ui/RippleEffect';
import Avatar from './Avatar';
import DotAnimation from './DotAnimation';
import FullNameTitle from './FullNameTitle';
import Icon from './icons/Icon';
import TypingStatus from './TypingStatus';
const UPDATE_INTERVAL = 1000 * 60; // 1 min
const PrivateChatInfo = ({ customPeer, typingStatus, avatarSize = 'medium', status, statusIcon, withDots, withMediaViewer, withUsername, withStory, withFullInfo, withUpdatingStatus, emojiStatusSize, noStatusOrTyping, noEmojiStatus, noFake, noVerified, noRtl, user, userStatus, self, isSavedMessages, isSavedDialog, areMessagesLoaded, adminMember, ripple, className, storyViewerOrigin, isSynced, onEmojiStatusClick, iconElement, rightElement, }) => {
    const { loadFullUser, openMediaViewer, loadMoreProfilePhotos, } = getActions();
    const lang = useOldLang();
    const { id: userId } = user || {};
    const hasAvatarMediaViewer = withMediaViewer && !isSavedMessages;
    useEffect(() => {
        if (userId) {
            if (withFullInfo && isSynced)
                loadFullUser({ userId });
            if (withMediaViewer)
                loadMoreProfilePhotos({ peerId: userId, isPreload: true });
        }
    }, [userId, withFullInfo, withMediaViewer, isSynced]);
    useIntervalForceUpdate(UPDATE_INTERVAL);
    const handleAvatarViewerOpen = useLastCallback((e, hasMedia) => {
        if (user && hasMedia) {
            e.stopPropagation();
            openMediaViewer({
                isAvatarView: true,
                chatId: user.id,
                mediaIndex: 0,
                origin: avatarSize === 'jumbo' ? MediaViewerOrigin.ProfileAvatar : MediaViewerOrigin.MiddleHeaderAvatar,
            });
        }
    });
    const mainUsername = useMemo(() => user && withUsername && getMainUsername(user), [user, withUsername]);
    if (!user && !customPeer) {
        return undefined;
    }
    function renderStatusOrTyping() {
        if (status) {
            return withDots ? (<DotAnimation className="status" content={status}/>) : (<span className="status" dir="auto">
          {statusIcon && <Icon className="status-icon" name={statusIcon}/>}
          {renderText(status)}
        </span>);
        }
        if (withUpdatingStatus && !areMessagesLoaded) {
            return (<DotAnimation className="status" content={lang('Updating')}/>);
        }
        if (customPeer?.subtitleKey) {
            return (<span className="status" dir="auto">
          <span className="user-status" dir="auto">{lang(customPeer.subtitleKey)}</span>
        </span>);
        }
        if (!user) {
            return undefined;
        }
        if (typingStatus) {
            return <TypingStatus typingStatus={typingStatus}/>;
        }
        if (isSystemBot(user.id)) {
            return undefined;
        }
        const translatedStatus = getUserStatus(lang, user, userStatus);
        const mainUserNameClassName = buildClassName('handle', translatedStatus && 'withStatus');
        return (<span className={buildClassName('status', isUserOnline(user, userStatus, true) && 'online')}>
        {mainUsername && <span className={mainUserNameClassName}>{mainUsername}</span>}
        {translatedStatus && <span className="user-status" dir="auto">{translatedStatus}</span>}
      </span>);
    }
    const customTitle = adminMember
        ? adminMember.customTitle || lang(adminMember.isOwner ? 'GroupInfo.LabelOwner' : 'GroupInfo.LabelAdmin')
        : undefined;
    function renderNameTitle() {
        if (customTitle) {
            return (<div className="info-name-title">
          <FullNameTitle peer={user} withEmojiStatus={!noEmojiStatus} emojiStatusSize={emojiStatusSize} isSavedMessages={isSavedMessages} isSavedDialog={isSavedDialog} onEmojiStatusClick={onEmojiStatusClick}/>
          {customTitle && <span className="custom-title">{customTitle}</span>}
        </div>);
        }
        return (<FullNameTitle peer={customPeer || user} noFake={noFake} noVerified={noVerified} withEmojiStatus={!noEmojiStatus} emojiStatusSize={emojiStatusSize} isSavedMessages={isSavedMessages} isSavedDialog={isSavedDialog} onEmojiStatusClick={onEmojiStatusClick} iconElement={iconElement}/>);
    }
    return (<div className={buildClassName('ChatInfo', className)} dir={!noRtl && lang.isRtl ? 'rtl' : undefined}>
      {isSavedDialog && self && (<Avatar key="saved-messages" size={avatarSize} peer={self} isSavedMessages className="saved-dialog-avatar"/>)}
      <Avatar key={user?.id} size={avatarSize} peer={customPeer || user} className={buildClassName(isSavedDialog && 'overlay-avatar')} isSavedMessages={isSavedMessages} isSavedDialog={isSavedDialog} withStory={withStory} storyViewerOrigin={storyViewerOrigin} storyViewerMode="single-peer" onClick={hasAvatarMediaViewer ? handleAvatarViewerOpen : undefined}/>
      <div className="info">
        {renderNameTitle()}
        {(status || (!isSavedMessages && !noStatusOrTyping)) && renderStatusOrTyping()}
      </div>
      {ripple && <RippleEffect />}
      {rightElement}
    </div>);
};
export default memo(withGlobal((global, { userId, forceShowSelf }) => {
    const { isSynced } = global;
    const user = userId ? selectUser(global, userId) : undefined;
    const userStatus = userId ? selectUserStatus(global, userId) : undefined;
    const isSavedMessages = !forceShowSelf && user && user.isSelf;
    const self = isSavedMessages ? user : selectUser(global, global.currentUserId);
    const areMessagesLoaded = Boolean(userId && selectChatMessages(global, userId));
    return {
        user,
        userStatus,
        isSavedMessages,
        areMessagesLoaded,
        self,
        isSynced,
    };
})(PrivateChatInfo));
