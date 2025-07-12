import { memo, useEffect, useRef } from '../../../lib/teact/teact';
import { getGlobal } from '../../../global';
import buildClassName from '../../../util/buildClassName';
import setTooltipItemVisible from '../../../util/setTooltipItemVisible';
import useLastCallback from '../../../hooks/useLastCallback';
import usePreviousDeprecated from '../../../hooks/usePreviousDeprecated';
import useShowTransitionDeprecated from '../../../hooks/useShowTransitionDeprecated';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import PrivateChatInfo from '../../common/PrivateChatInfo';
import ListItem from '../../ui/ListItem';
import './MentionTooltip.scss';
const MentionTooltip = ({ isOpen, onClose, onInsertUserName, filteredUsers, }) => {
    const containerRef = useRef();
    const { shouldRender, transitionClassNames } = useShowTransitionDeprecated(isOpen, undefined, undefined, false);
    const handleUserSelect = useLastCallback((userId, forceFocus = false) => {
        // No need for expensive global updates on users, so we avoid them
        const usersById = getGlobal().users.byId;
        const user = usersById[userId];
        if (!user) {
            return;
        }
        onInsertUserName(user, forceFocus);
    });
    const handleClick = useLastCallback((e, id) => {
        e.preventDefault();
        handleUserSelect(id);
    });
    const handleSelectMention = useLastCallback((member) => {
        handleUserSelect(member.id, true);
    });
    const selectedMentionIndex = useKeyboardNavigation({
        isActive: isOpen,
        items: filteredUsers,
        onSelect: handleSelectMention,
        shouldSelectOnTab: true,
        shouldSaveSelectionOnUpdateItems: true,
        onClose,
    });
    useEffect(() => {
        setTooltipItemVisible('.chat-item-clickable', selectedMentionIndex, containerRef);
    }, [selectedMentionIndex]);
    useEffect(() => {
        if (filteredUsers && !filteredUsers.length) {
            onClose();
        }
    }, [filteredUsers, onClose]);
    const prevChatMembers = usePreviousDeprecated(filteredUsers?.length
        ? filteredUsers
        : undefined, shouldRender);
    const renderedChatMembers = filteredUsers && !filteredUsers.length
        ? prevChatMembers
        : filteredUsers;
    if (!shouldRender || (renderedChatMembers && !renderedChatMembers.length)) {
        return undefined;
    }
    const className = buildClassName('MentionTooltip composer-tooltip custom-scroll', transitionClassNames);
    return (<div className={className} ref={containerRef}>
      {renderedChatMembers?.map(({ id }, index) => (<ListItem key={id} className="chat-item-clickable scroll-item smaller-icon" onClick={handleClick} clickArg={id} focus={selectedMentionIndex === index}>
          <PrivateChatInfo userId={id} avatarSize="small" withUsername/>
        </ListItem>))}
    </div>);
};
export default memo(MentionTooltip);
