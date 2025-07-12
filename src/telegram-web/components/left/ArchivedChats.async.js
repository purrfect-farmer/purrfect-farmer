import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
import Loading from '../ui/Loading';
const ArchivedChatsAsync = (props) => {
    const ArchivedChats = useModuleLoader(Bundles.Extra, 'ArchivedChats');
    return ArchivedChats ? <ArchivedChats {...props}/> : <Loading />;
};
export default ArchivedChatsAsync;
