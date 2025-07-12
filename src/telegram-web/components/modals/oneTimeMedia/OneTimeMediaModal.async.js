import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const OneTimeMediaModalAsync = (props) => {
    const { modal } = props;
    const OneTimeMediaModal = useModuleLoader(Bundles.Extra, 'OneTimeMediaModal', !modal);
    return OneTimeMediaModal ? <OneTimeMediaModal {...props}/> : undefined;
};
export default OneTimeMediaModalAsync;
