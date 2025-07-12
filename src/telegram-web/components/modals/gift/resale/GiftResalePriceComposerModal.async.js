import { Bundles } from '../../../../util/moduleLoader';
import useModuleLoader from '../../../../hooks/useModuleLoader';
const GiftResalePriceComposerModalAsync = (props) => {
    const { modal } = props;
    const GiftResalePriceComposerModal = useModuleLoader(Bundles.Stars, 'GiftResalePriceComposerModal', !modal);
    return GiftResalePriceComposerModal ? <GiftResalePriceComposerModal {...props}/> : undefined;
};
export default GiftResalePriceComposerModalAsync;
