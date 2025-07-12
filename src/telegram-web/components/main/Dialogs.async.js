import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const DialogsAsync = ({ isOpen }) => {
    const Dialogs = useModuleLoader(Bundles.Extra, 'Dialogs', !isOpen);
    return Dialogs ? <Dialogs /> : undefined;
};
export default DialogsAsync;
