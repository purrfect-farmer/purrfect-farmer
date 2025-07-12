import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const CalendarModalAsync = (props) => {
    const { isOpen } = props;
    const CalendarModal = useModuleLoader(Bundles.Extra, 'CalendarModal', !isOpen);
    return CalendarModal ? <CalendarModal {...props}/> : undefined;
};
export default CalendarModalAsync;
