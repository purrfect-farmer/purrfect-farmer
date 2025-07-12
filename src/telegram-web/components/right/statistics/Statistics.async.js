import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
import Loading from '../../ui/Loading';
const StatisticsAsync = (props) => {
    const Statistics = useModuleLoader(Bundles.Extra, 'Statistics');
    return Statistics ? <Statistics {...props}/> : <Loading />;
};
export default StatisticsAsync;
