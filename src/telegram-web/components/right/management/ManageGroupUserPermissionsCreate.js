import { memo, useCallback, useMemo } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';
import { ManagementScreens } from '../../../types';
import { isChatChannel, sortUserIds } from '../../../global/helpers';
import { selectChat, selectChatFullInfo } from '../../../global/selectors';
import useHistoryBack from '../../../hooks/useHistoryBack';
import NothingFound from '../../common/NothingFound';
import PrivateChatInfo from '../../common/PrivateChatInfo';
import ListItem from '../../ui/ListItem';
const ManageGroupUserPermissionsCreate = ({ usersById, userStatusesById, members, isChannel, onScreenSelect, onChatMemberSelect, onClose, isActive, }) => {
    useHistoryBack({
        isActive,
        onBack: onClose,
    });
    const memberIds = useMemo(() => {
        if (!members || !usersById) {
            return undefined;
        }
        return sortUserIds(members.filter((member) => !member.isOwner).map(({ userId }) => userId), usersById, userStatusesById);
    }, [members, usersById, userStatusesById]);
    const handleExceptionMemberClick = useCallback((memberId) => {
        onChatMemberSelect(memberId);
        onScreenSelect(ManagementScreens.GroupUserPermissions);
    }, [onChatMemberSelect, onScreenSelect]);
    return (<div className="Management">
      <div className="custom-scroll">
        <div className="section" teactFastList>
          {memberIds ? (memberIds.map((id, i) => (<ListItem key={id} teactOrderKey={i} className="chat-item-clickable scroll-item" onClick={() => handleExceptionMemberClick(id)}>
                <PrivateChatInfo userId={id} forceShowSelf/>
              </ListItem>))) : (<NothingFound teactOrderKey={0} key="nothing-found" text={isChannel ? 'No subscribers found' : 'No members found'}/>)}
        </div>
      </div>
    </div>);
};
export default memo(withGlobal((global, { chatId }) => {
    const chat = selectChat(global, chatId);
    const { byId: usersById, statusesById: userStatusesById } = global.users;
    const members = selectChatFullInfo(global, chatId)?.members;
    const isChannel = chat && isChatChannel(chat);
    return {
        members,
        usersById,
        userStatusesById,
        isChannel,
    };
})(ManageGroupUserPermissionsCreate));
