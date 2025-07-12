import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const MainAsync = (props) => {
    const Main = useModuleLoader(Bundles.Main, 'Main');
    return Main ? <Main {...props}/> : undefined;
};
export default MainAsync;
