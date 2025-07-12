import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const BoostModalAsync = (props) => {
    const { modal } = props;
    const BoostModal = useModuleLoader(Bundles.Extra, 'BoostModal', !modal);
    return BoostModal ? <BoostModal {...props}/> : undefined;
};
export default BoostModalAsync;
