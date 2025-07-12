import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const GiftModalAsync = (props) => {
    const { modal } = props;
    const GiftModal = useModuleLoader(Bundles.Stars, 'GiftModal', !modal);
    return GiftModal ? <GiftModal {...props}/> : undefined;
};
export default GiftModalAsync;
