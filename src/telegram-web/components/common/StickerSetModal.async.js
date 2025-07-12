import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const StickerSetModalAsync = (props) => {
    const { isOpen } = props;
    const StickerSetModal = useModuleLoader(Bundles.Extra, 'StickerSetModal', !isOpen);
    return StickerSetModal ? <StickerSetModal {...props}/> : undefined;
};
export default StickerSetModalAsync;
