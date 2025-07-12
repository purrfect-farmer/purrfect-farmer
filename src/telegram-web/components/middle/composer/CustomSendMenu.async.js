import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const CustomSendMenuAsync = (props) => {
    const { isOpen } = props;
    const CustomSend = useModuleLoader(Bundles.Extra, 'CustomSendMenu', !isOpen);
    return CustomSend ? <CustomSend {...props}/> : undefined;
};
export default CustomSendMenuAsync;
