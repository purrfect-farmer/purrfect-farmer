import { useCallback } from '../../lib/teact/teact';
import { getActions } from '../../global';
import buildClassName from '../../util/buildClassName';
import Link from '../ui/Link';
const GroupCallLink = ({ className, groupCall, children, }) => {
    const { requestMasterAndJoinGroupCall } = getActions();
    const handleClick = useCallback(() => {
        if (groupCall) {
            requestMasterAndJoinGroupCall({ id: groupCall.id, accessHash: groupCall.accessHash });
        }
    }, [groupCall, requestMasterAndJoinGroupCall]);
    if (!groupCall) {
        return children;
    }
    return (<Link className={buildClassName('GroupCallLink', className)} onClick={handleClick}>{children}</Link>);
};
export default GroupCallLink;
