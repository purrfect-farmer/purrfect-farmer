import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const StarPaymentModalAsync = (props) => {
    const { modal } = props;
    const StarPaymentModal = useModuleLoader(Bundles.Stars, 'StarPaymentModal', !modal);
    return StarPaymentModal ? <StarPaymentModal {...props}/> : undefined;
};
export default StarPaymentModalAsync;
