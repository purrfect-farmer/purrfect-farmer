import { memo } from '../../lib/teact/teact';
import { withGlobal } from '../../global';
import { selectTabState } from '../../global/selectors';
import { pick } from '../../util/iteratees';
import Notification from '../ui/Notification';
const Notifications = ({ notifications }) => {
    if (!notifications.length) {
        return undefined;
    }
    return (<div id="Notifications">
      {notifications.map((notification) => (<Notification key={notification.localId} notification={notification}/>))}
    </div>);
};
export default memo(withGlobal((global) => pick(selectTabState(global), ['notifications']))(Notifications));
