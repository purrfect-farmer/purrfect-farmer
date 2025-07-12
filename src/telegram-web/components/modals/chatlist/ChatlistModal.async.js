import { Bundles } from '../../../util/moduleLoader';
import useModuleLoader from '../../../hooks/useModuleLoader';
const ChatlistModalAsync = (props) => {
    const { modal } = props;
    const ChatlistModal = useModuleLoader(Bundles.Extra, 'ChatlistModal', !modal);
    return ChatlistModal ? <ChatlistModal {...props}/> : undefined;
};
export default ChatlistModalAsync;
