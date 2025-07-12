import { Bundles } from '../../../../util/moduleLoader';
import useModuleLoader from '../../../../hooks/useModuleLoader';
const ReactionPickerAsync = (props) => {
    const { isOpen } = props;
    const ReactionPicker = useModuleLoader(Bundles.Extra, 'ReactionPicker', !isOpen);
    return ReactionPicker ? <ReactionPicker {...props}/> : undefined;
};
export default ReactionPickerAsync;
