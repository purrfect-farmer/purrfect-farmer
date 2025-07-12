import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const EmojiTooltipAsync = (props) => {
    const { isOpen } = props;
    const EmojiTooltip = useModuleLoader(Bundles.Extra, 'EmojiTooltip', !isOpen);
    return EmojiTooltip ? <EmojiTooltip {...props}/> : undefined;
};
export default EmojiTooltipAsync;
