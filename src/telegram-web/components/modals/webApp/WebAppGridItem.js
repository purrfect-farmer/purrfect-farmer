import { memo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { selectUser, } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import { formatIntegerCompact } from '../../../util/textFormat';
import { extractCurrentThemeParams } from '../../../util/themeStyle';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';
import PeerBadge from '../../common/PeerBadge';
import styles from './WebAppGridItem.module.scss';
function WebAppGridItem({ user, isPopularApp }) {
    const { requestMainWebView, } = getActions();
    const lang = useLang();
    const handleClick = useLastCallback(() => {
        if (!user) {
            return;
        }
        const botId = user?.id;
        if (!botId) {
            return;
        }
        const theme = extractCurrentThemeParams();
        requestMainWebView({
            botId,
            peerId: botId,
            theme,
        });
    });
    if (!user)
        return undefined;
    const title = user?.firstName;
    const activeUserCount = user?.botActiveUsers;
    const badgeText = activeUserCount && isPopularApp ? formatIntegerCompact(lang, activeUserCount) : undefined;
    return (<div className={styles.container} onClick={handleClick}>
      <PeerBadge className={buildClassName(styles.avatarContainer, isPopularApp && 'PopularAppGridItem')} textClassName={styles.name} badgeClassName={styles.userCountBadge} badgeIconClassName={styles.userBadgeIcon} peer={user} text={title} badgeText={badgeText} badgeIcon="user-filled"/>
    </div>);
}
export default memo(withGlobal((global, { chatId }) => {
    const user = selectUser(global, chatId);
    return {
        user,
    };
})(WebAppGridItem));
