import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const PreparedMessageModalAsync = (props) => {
    const { modal } = props;
    const PreparedMessageModal = useModuleLoader(Bundles.Extra, 'PreparedMessageModal', !modal);
    return PreparedMessageModal ? <PreparedMessageModal {...props}/> : undefined;
};
export default PreparedMessageModalAsync;
