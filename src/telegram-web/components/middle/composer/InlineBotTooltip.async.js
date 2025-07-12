import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const InlineBotTooltipAsync = (props) => {
    const { isOpen } = props;
    const InlineBotTooltip = useModuleLoader(Bundles.Extra, 'InlineBotTooltip', !isOpen);
    return InlineBotTooltip ? <InlineBotTooltip {...props}/> : undefined;
};
export default InlineBotTooltipAsync;
