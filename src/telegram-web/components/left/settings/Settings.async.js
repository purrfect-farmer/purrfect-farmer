import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
import Loading from '../../ui/Loading';
const SettingsAsync = (props) => {
    const Settings = useModuleLoader(Bundles.Extra, 'Settings');
    return Settings ? <Settings {...props}/> : <Loading />;
};
export default SettingsAsync;
