import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const ChatFolderModalAsync = (props) => {
    const { isOpen } = props;
    const ChatFolderModal = useModuleLoader(Bundles.Extra, 'ChatFolderModal', !isOpen);
    return ChatFolderModal ? <ChatFolderModal {...props}/> : undefined;
};
export default ChatFolderModalAsync;
