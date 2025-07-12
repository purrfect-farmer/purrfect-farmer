import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const StarsGiftingPickerModalAsync = (props) => {
    const { isOpen } = props;
    const StarsGiftingPickerModal = useModuleLoader(Bundles.Stars, 'StarsGiftingPickerModal', !isOpen);
    return StarsGiftingPickerModal ? <StarsGiftingPickerModal {...props}/> : undefined;
};
export default StarsGiftingPickerModalAsync;
