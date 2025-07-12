import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const MiddleSearchAsync = (props) => {
    const { isActive } = props;
    const MiddleSearch = useModuleLoader(Bundles.Extra, 'MiddleSearch', !isActive, true);
    return MiddleSearch ? <MiddleSearch {...props}/> : undefined;
};
export default MiddleSearchAsync;
