import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
import Loading from '../../ui/Loading';
const LeftSearchAsync = (props) => {
    const LeftSearch = useModuleLoader(Bundles.Extra, 'LeftSearch');
    return LeftSearch ? <LeftSearch {...props}/> : <Loading />;
};
export default LeftSearchAsync;
