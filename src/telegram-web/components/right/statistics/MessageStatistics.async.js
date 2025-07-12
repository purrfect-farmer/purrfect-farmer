import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
import Loading from '../../ui/Loading';
const MessageStatisticsAsync = (props) => {
    const MessageStatistics = useModuleLoader(Bundles.Extra, 'MessageStatistics');
    return MessageStatistics ? <MessageStatistics {...props}/> : <Loading />;
};
export default MessageStatisticsAsync;
