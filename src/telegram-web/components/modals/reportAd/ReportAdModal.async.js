import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const ReportAdModalAsync = (props) => {
    const { modal } = props;
    const ReportAdModal = useModuleLoader(Bundles.Extra, 'ReportAdModal', !modal);
    return ReportAdModal ? <ReportAdModal {...props}/> : undefined;
};
export default ReportAdModalAsync;
