import { memo, useMemo } from '../../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../../global';
import { ManagementScreens } from '../../../types';
import { getHasAdminRight, getUserFullName, isChatChannel } from '../../../global/helpers';
import { selectChat, selectChatFullInfo } from '../../../global/selectors';
import { partition } from '../../../util/iteratees';
import useHistoryBack from '../../../hooks/useHistoryBack';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import Icon from '../../common/icons/Icon';
import PrivateChatInfo from '../../common/PrivateChatInfo';
import Checkbox from '../../ui/Checkbox';
import FloatingActionButton from '../../ui/FloatingActionButton';
import ListItem from '../../ui/ListItem';
const ManageChatAdministrators = ({ isActive, chat, isChannel, currentUserId, adminMembersById, onScreenSelect, onChatMemberSelect, onClose, }) => {
    const { toggleSignatures } = getActions();
    const lang = useOldLang();
    useHistoryBack({
        isActive,
        onBack: onClose,
    });
    const areSignaturesEnabled = Boolean(chat?.areSignaturesShown);
    const areProfilesEnabled = Boolean(chat?.areProfilesShown);
    const canAddNewAdmins = Boolean(chat?.isCreator || (chat && getHasAdminRight(chat, 'addAdmins')));
    const canToggleSignatures = isChannel && getHasAdminRight(chat, 'postMessages');
    const adminMembers = useMemo(() => {
        if (!adminMembersById) {
            return [];
        }
        const [owner, admins] = partition(Object.values(adminMembersById), (member) => member.isOwner);
        return [...owner, ...admins];
    }, [adminMembersById]);
    const handleAdminMemberClick = useLastCallback((member) => {
        onChatMemberSelect(member.userId, member.promotedByUserId === currentUserId);
        onScreenSelect(ManagementScreens.ChatAdminRights);
    });
    const handleToggleSignatures = useLastCallback(() => {
        toggleSignatures({
            chatId: chat.id,
            areProfilesEnabled,
            areSignaturesEnabled: !areSignaturesEnabled,
        });
    });
    const handleToggleProfiles = useLastCallback(() => {
        toggleSignatures({
            chatId: chat.id,
            areProfilesEnabled: !areProfilesEnabled,
            areSignaturesEnabled,
        });
    });
    const handleAddAdminClick = useLastCallback(() => {
        onScreenSelect(ManagementScreens.GroupAddAdmins);
    });
    const getMemberStatus = useLastCallback((member) => {
        if (member.isOwner) {
            return lang('ChannelCreator');
        }
        // No need for expensive global updates on users, so we avoid them
        const usersById = getGlobal().users.byId;
        const promotedByUser = member.promotedByUserId ? usersById[member.promotedByUserId] : undefined;
        if (promotedByUser) {
            return lang('EditAdminPromotedBy', getUserFullName(promotedByUser));
        }
        return lang('ChannelAdmin');
    });
    return (<div className="Management">
      <div className="panel-content custom-scroll">
        <div className="section">
          <ListItem icon="recent" multiline disabled>
            <span className="title">{lang('EventLog')}</span>
            <span className="subtitle">{lang(isChannel ? 'EventLogInfoDetailChannel' : 'EventLogInfoDetail')}</span>
          </ListItem>
        </div>

        <div className="section" dir={lang.isRtl ? 'rtl' : undefined}>
          <p className="section-help" dir="auto">
            {lang(isChannel
            ? 'Channel.Management.AddModeratorHelp'
            : 'Group.Management.AddModeratorHelp')}
          </p>

          {adminMembers.map((member) => (<ListItem key={member.userId} className="chat-item-clickable" onClick={() => handleAdminMemberClick(member)}>
              <PrivateChatInfo userId={member.userId} status={getMemberStatus(member)} forceShowSelf/>
            </ListItem>))}

          <FloatingActionButton isShown={canAddNewAdmins} onClick={handleAddAdminClick} ariaLabel={lang('Channel.Management.AddModerator')}>
            <Icon name="add-user-filled"/>
          </FloatingActionButton>
        </div>

        {canToggleSignatures && (<div className="section">
            <div className="ListItem narrow">
              <Checkbox checked={areSignaturesEnabled} label={lang('ChannelSignMessages')} onChange={handleToggleSignatures}/>
            </div>
            {areSignaturesEnabled && (<>
                <div className="ListItem narrow">
                  <Checkbox checked={areProfilesEnabled} label={lang('ChannelSignMessagesWithProfile')} onChange={handleToggleProfiles}/>
                </div>
                <p className="section-info section-info_push">
                  {lang('ChannelSignProfilesInfo')}
                </p>
              </>)}
          </div>)}
      </div>
    </div>);
};
export default memo(withGlobal((global, { chatId }) => {
    const chat = selectChat(global, chatId);
    return {
        chat,
        currentUserId: global.currentUserId,
        isChannel: chat && isChatChannel(chat),
        adminMembersById: selectChatFullInfo(global, chatId)?.adminMembersById,
    };
})(ManageChatAdministrators));
