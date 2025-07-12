import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const BotTrustModalAsync = (props) => {
    const { bot } = props;
    const BotTrustModal = useModuleLoader(Bundles.Extra, 'BotTrustModal', !bot);
    return BotTrustModal ? <BotTrustModal {...props}/> : undefined;
};
export default BotTrustModalAsync;
