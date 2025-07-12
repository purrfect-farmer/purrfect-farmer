import { memo, useCallback } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { getHasAdminRight, getUserFullName, isChatChannel } from '../../../global/helpers';
import { selectChat, selectChatFullInfo } from '../../../global/selectors';
import { MEMO_EMPTY_ARRAY } from '../../../util/memo';
import useFlag from '../../../hooks/useFlag';
import useHistoryBack from '../../../hooks/useHistoryBack';
import useOldLang from '../../../hooks/useOldLang';
import Icon from '../../common/icons/Icon';
import PrivateChatInfo from '../../common/PrivateChatInfo';
import FloatingActionButton from '../../ui/FloatingActionButton';
import ListItem from '../../ui/ListItem';
import RemoveGroupUserModal from './RemoveGroupUserModal';
const ManageChatRemovedUsers = ({ chat, usersById, canDeleteMembers, removedMembers, isChannel, onClose, isActive, }) => {
    const { updateChatMemberBannedRights } = getActions();
    const lang = useOldLang();
    const [isRemoveUserModalOpen, openRemoveUserModal, closeRemoveUserModal] = useFlag();
    useHistoryBack({
        isActive,
        onBack: onClose,
    });
    const getRemovedBy = useCallback((member) => {
        if (!member.kickedByUserId) {
            return undefined;
        }
        const kickedByUser = usersById[member.kickedByUserId];
        if (!kickedByUser) {
            return undefined;
        }
        return lang('UserRemovedBy', getUserFullName(kickedByUser));
    }, [lang, usersById]);
    const getContextActions = useCallback((member) => {
        if (!chat) {
            return undefined;
        }
        return [{
                title: lang('Unblock'),
                icon: 'delete',
                destructive: true,
                handler: () => updateChatMemberBannedRights({
                    chatId: chat.id,
                    userId: member.userId,
                    bannedRights: {},
                }),
            }];
    }, [lang, chat, updateChatMemberBannedRights]);
    return (<div className="Management">
      <div className="panel-content custom-scroll">
        <div className="section" dir={lang.isRtl ? 'rtl' : undefined}>
          <p className="section-help">{lang(isChannel ? 'NoBlockedChannel2' : 'NoBlockedGroup2')}</p>

          {removedMembers.map((member) => (<ListItem key={member.userId} className="chat-item-clickable" ripple contextActions={getContextActions(member)}>
              <PrivateChatInfo userId={member.userId} status={getRemovedBy(member)} forceShowSelf/>
            </ListItem>))}
          {canDeleteMembers && (<FloatingActionButton isShown onClick={openRemoveUserModal} ariaLabel={lang('Channel.EditAdmin.Permission.BanUsers')}>
              <Icon name="add-user-filled"/>
            </FloatingActionButton>)}
          {chat && canDeleteMembers && (<RemoveGroupUserModal chat={chat} isOpen={isRemoveUserModalOpen} onClose={closeRemoveUserModal}/>)}
        </div>
      </div>
    </div>);
};
export default memo(withGlobal((global, { chatId }) => {
    const chat = selectChat(global, chatId);
    const { byId: usersById } = global.users;
    const canDeleteMembers = chat && (getHasAdminRight(chat, 'banUsers') || chat.isCreator);
    return {
        chat,
        usersById,
        canDeleteMembers,
        removedMembers: selectChatFullInfo(global, chatId)?.kickedMembers || MEMO_EMPTY_ARRAY,
        isChannel: chat && isChatChannel(chat),
    };
})(ManageChatRemovedUsers));
