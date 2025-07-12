import { Bundles } from '../../../../util/moduleLoader';
import useModuleLoader from '../../../../hooks/useModuleLoader';
const GiftInfoModalAsync = (props) => {
    const { modal } = props;
    const GiftInfoModal = useModuleLoader(Bundles.Stars, 'GiftInfoModal', !modal);
    return GiftInfoModal ? <GiftInfoModal {...props}/> : undefined;
};
export default GiftInfoModalAsync;
