import { memo } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import { formatPastTimeShort } from '../../util/dates/dateFormat';
import useOldLang from '../../hooks/useOldLang';
import MessageOutgoingStatus from './MessageOutgoingStatus';
import './LastMessageMeta.scss';
const LastMessageMeta = ({ className, message, outgoingStatus, draftDate, }) => {
    const lang = useOldLang();
    const shouldUseDraft = draftDate && draftDate > message.date;
    return (<div className={buildClassName('LastMessageMeta', className)}>
      {outgoingStatus && !shouldUseDraft && (<MessageOutgoingStatus status={outgoingStatus}/>)}
      <span className="time">
        {formatPastTimeShort(lang, (shouldUseDraft ? draftDate : message.date) * 1000)}
      </span>
    </div>);
};
export default memo(LastMessageMeta);
