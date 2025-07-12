import { memo, useCallback } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';
import { selectTabState } from '../../global/selectors';
import useOldLang from '../../hooks/useOldLang';
import CalendarModal from '../common/CalendarModal';
const HistoryCalendar = ({ isOpen, selectedAt, }) => {
    const { searchMessagesByDate, closeHistoryCalendar } = getActions();
    const handleJumpToDate = useCallback((date) => {
        searchMessagesByDate({ timestamp: date.getTime() / 1000 });
        closeHistoryCalendar();
    }, [closeHistoryCalendar, searchMessagesByDate]);
    const lang = useOldLang();
    return (<CalendarModal isOpen={isOpen} selectedAt={selectedAt} isPastMode submitButtonLabel={lang('JumpToDate')} onClose={closeHistoryCalendar} onSubmit={handleJumpToDate}/>);
};
export default memo(withGlobal((global) => {
    return { selectedAt: selectTabState(global).historyCalendarSelectedAt };
})(HistoryCalendar));
