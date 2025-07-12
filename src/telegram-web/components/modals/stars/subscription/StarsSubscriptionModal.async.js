import { Bundles } from '../../../../util/moduleLoader';
import useModuleLoader from '../../../../hooks/useModuleLoader';
const StarsSubscriptionModalAsync = (props) => {
    const { modal } = props;
    const StarsSubscriptionModal = useModuleLoader(Bundles.Stars, 'StarsSubscriptionModal', !modal);
    return StarsSubscriptionModal ? <StarsSubscriptionModal {...props}/> : undefined;
};
export default StarsSubscriptionModalAsync;
