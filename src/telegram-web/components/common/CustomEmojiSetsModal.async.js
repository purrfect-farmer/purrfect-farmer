import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const CustomEmojiSetsModalAsync = (props) => {
    const { customEmojiSetIds } = props;
    const CustomEmojiSetsModal = useModuleLoader(Bundles.Extra, 'CustomEmojiSetsModal', !customEmojiSetIds);
    return CustomEmojiSetsModal ? <CustomEmojiSetsModal {...props}/> : undefined;
};
export default CustomEmojiSetsModalAsync;
