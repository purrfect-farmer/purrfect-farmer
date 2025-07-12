import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const WebAppModalAsync = (props) => {
    const { modal } = props;
    const WebAppModal = useModuleLoader(Bundles.Extra, 'WebAppModal', !modal);
    return WebAppModal ? <WebAppModal {...props}/> : undefined;
};
export default WebAppModalAsync;
