import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
import Loading from '../ui/Loading';
const EditTopicAsync = (props) => {
    const EditTopic = useModuleLoader(Bundles.Extra, 'EditTopic');
    return EditTopic ? <EditTopic {...props}/> : <Loading />;
};
export default EditTopicAsync;
