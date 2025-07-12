import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const VerificationMonetizationModalAsync = (props) => {
    const { modal } = props;
    const VerificationMonetizationModal = useModuleLoader(Bundles.Extra, 'VerificationMonetizationModal', !modal);
    return VerificationMonetizationModal ? <VerificationMonetizationModal {...props}/> : undefined;
};
export default VerificationMonetizationModalAsync;
