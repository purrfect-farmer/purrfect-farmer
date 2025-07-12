import { Bundles } from '../../util/moduleLoader';
import useModuleLoader from '../../hooks/useModuleLoader';
const NotificationsAsync = ({ isOpen }) => {
    const Notifications = useModuleLoader(Bundles.Extra, 'Notifications', !isOpen);
    return Notifications ? <Notifications /> : undefined;
};
export default NotificationsAsync;
