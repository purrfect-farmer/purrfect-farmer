import { useCallback } from '../../lib/teact/teact';
import { getActions } from '../../global';
import buildClassName from '../../util/buildClassName';
import Link from '../ui/Link';
const UserLink = ({ className, sender, children, }) => {
    const { openChat } = getActions();
    const handleClick = useCallback(() => {
        if (sender) {
            openChat({ id: sender.id });
        }
    }, [sender, openChat]);
    if (!sender) {
        return children;
    }
    return (<Link className={buildClassName('UserLink', className)} onClick={handleClick}>{children}</Link>);
};
export default UserLink;
