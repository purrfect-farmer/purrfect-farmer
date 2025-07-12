import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const StickerTooltipAsync = (props) => {
    const { isOpen } = props;
    const StickerTooltip = useModuleLoader(Bundles.Extra, 'StickerTooltip', !isOpen);
    return StickerTooltip ? <StickerTooltip {...props}/> : undefined;
};
export default StickerTooltipAsync;
