import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const ActiveCallHeaderAsync = (props) => {
    const { isActive } = props;
    const ActiveCallHeader = useModuleLoader(Bundles.Calls, 'ActiveCallHeader', !isActive);
    return ActiveCallHeader ? <ActiveCallHeader /> : undefined;
};
export default ActiveCallHeaderAsync;
