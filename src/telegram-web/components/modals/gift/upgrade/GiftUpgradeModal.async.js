import { Bundles } from '../../../../util/moduleLoader';
import useModuleLoader from '../../../../hooks/useModuleLoader';
const GiftUpgradeModalAsync = (props) => {
    const { modal } = props;
    const GiftUpgradeModal = useModuleLoader(Bundles.Stars, 'GiftUpgradeModal', !modal);
    return GiftUpgradeModal ? <GiftUpgradeModal {...props}/> : undefined;
};
export default GiftUpgradeModalAsync;
