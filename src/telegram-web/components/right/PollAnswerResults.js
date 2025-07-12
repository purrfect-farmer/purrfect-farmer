import { memo, useCallback, useEffect, useState, } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';
import { selectTabState } from '../../global/selectors';
import { isUserId } from '../../util/entities/ids';
import { renderTextWithEntities } from '../common/helpers/renderTextWithEntities';
import useOldLang from '../../hooks/useOldLang';
import usePreviousDeprecated from '../../hooks/usePreviousDeprecated';
import GroupChatInfo from '../common/GroupChatInfo';
import PrivateChatInfo from '../common/PrivateChatInfo';
import ListItem from '../ui/ListItem';
import Loading from '../ui/Loading';
import ShowMoreButton from '../ui/ShowMoreButton';
import './PollAnswerResults.scss';
const INITIAL_LIMIT = 4;
const VIEW_MORE_LIMIT = 50;
const PollAnswerResults = ({ chat, message, answer, answerVote, totalVoters, voters, offset, }) => {
    const { loadPollOptionResults, openChat, closePollResults, } = getActions();
    const prevVotersCount = usePreviousDeprecated(answerVote.votersCount);
    const [isLoading, setIsLoading] = useState(true);
    const areVotersLoaded = Boolean(voters);
    const { option, text } = answer;
    const lang = useOldLang();
    useEffect(() => {
        // For update when new votes arrive or when the user takes back his vote
        if (!areVotersLoaded || prevVotersCount !== answerVote.votersCount) {
            loadPollOptionResults({
                chat, messageId: message.id, option, offset, limit: INITIAL_LIMIT, shouldResetVoters: true,
            });
        }
        // eslint-disable-next-line
    }, [answerVote.votersCount, areVotersLoaded]);
    const handleViewMoreClick = useCallback(() => {
        setIsLoading(true);
        loadPollOptionResults({
            chat, messageId: message.id, option, offset, limit: VIEW_MORE_LIMIT,
        });
    }, [chat, loadPollOptionResults, message.id, offset, option]);
    useEffect(() => {
        setIsLoading(false);
    }, [voters]);
    const handleMemberClick = useCallback((id) => {
        openChat({ id });
        closePollResults();
    }, [closePollResults, openChat]);
    function renderViewMoreButton() {
        const leftVotersCount = answerVote.votersCount - voters.length;
        return answerVote.votersCount > INITIAL_LIMIT && leftVotersCount > 0 && (<ShowMoreButton count={leftVotersCount} itemName="voter" isLoading={isLoading} onClick={handleViewMoreClick}/>);
    }
    return (<div className="PollAnswerResults">
      <div className="poll-voters">
        {voters
            ? voters.map((id) => (<ListItem key={id} className="chat-item-clickable" onClick={() => handleMemberClick(id)}>
              {isUserId(id) ? (<PrivateChatInfo avatarSize="tiny" userId={id} forceShowSelf noStatusOrTyping/>) : (<GroupChatInfo avatarSize="tiny" chatId={id} noStatusOrTyping/>)}
            </ListItem>))
            : <Loading />}
        {voters && renderViewMoreButton()}
      </div>
      <div className="answer-head" dir={lang.isRtl ? 'rtl' : undefined}>
        <span className="answer-title" dir="auto">
          {renderTextWithEntities({
            text: text.text,
            entities: text.entities,
        })}
        </span>
        <span className="answer-percent" dir={lang.isRtl ? 'auto' : undefined}>
          {getPercentage(answerVote.votersCount, totalVoters)}
          %
        </span>
      </div>
    </div>);
};
function getPercentage(value, total) {
    return total > 0 ? ((value / total) * 100).toFixed() : 0;
}
export default memo(withGlobal((global, { answer }) => {
    const { voters, offsets } = selectTabState(global).pollResults;
    return {
        voters: voters?.[answer.option],
        offset: (offsets?.[answer.option]) || '',
    };
})(PollAnswerResults));
