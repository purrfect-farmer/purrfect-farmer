import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
import Loading from '../../ui/Loading';
const ManagementAsync = (props) => {
    const Management = useModuleLoader(Bundles.Extra, 'Management');
    return Management ? <Management {...props}/> : <Loading />;
};
export default ManagementAsync;
