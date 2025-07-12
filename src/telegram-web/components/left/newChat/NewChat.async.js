import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
import Loading from '../../ui/Loading';
const NewChatAsync = (props) => {
    const NewChat = useModuleLoader(Bundles.Extra, 'NewChat');
    return NewChat ? <NewChat {...props}/> : <Loading />;
};
export default NewChatAsync;
