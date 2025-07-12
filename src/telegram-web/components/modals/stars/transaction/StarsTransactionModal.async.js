import { Bundles } from '../../../../util/moduleLoader';
import useModuleLoader from '../../../../hooks/useModuleLoader';
const StarsTransactionModalAsync = (props) => {
    const { modal } = props;
    const StarsTransactionModal = useModuleLoader(Bundles.Stars, 'StarsTransactionInfoModal', !modal);
    return StarsTransactionModal ? <StarsTransactionModal {...props}/> : undefined;
};
export default StarsTransactionModalAsync;
