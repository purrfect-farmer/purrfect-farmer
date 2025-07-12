import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const ReportModalAsync = (props) => {
    const { modal } = props;
    const ReportModal = useModuleLoader(Bundles.Extra, 'ReportModal', !modal);
    return ReportModal ? <ReportModal {...props}/> : undefined;
};
export default ReportModalAsync;
