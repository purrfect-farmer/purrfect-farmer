import { memo, useRef } from '../../lib/teact/teact';
import { withGlobal } from '../../global';
import buildClassName from '../../util/buildClassName';
import { getIsMobile } from '../../hooks/useAppLayout';
import useHorizontalScroll from '../../hooks/useHorizontalScroll';
import useOldLang from '../../hooks/useOldLang';
import StoryRibbonButton from './StoryRibbonButton';
import styles from './StoryRibbon.module.scss';
function StoryRibbon({ isArchived, className, orderedPeerIds, usersById, chatsById, isClosing, }) {
    const lang = useOldLang();
    const fullClassName = buildClassName(styles.root, !orderedPeerIds.length && styles.hidden, isClosing && styles.closing, className, 'no-scrollbar');
    const ref = useRef();
    useHorizontalScroll(ref, getIsMobile());
    return (<div ref={ref} id="StoryRibbon" className={fullClassName} dir={lang.isRtl ? 'rtl' : undefined}>
      {orderedPeerIds.map((peerId) => {
            const peer = usersById[peerId] || chatsById[peerId];
            if (!peer) {
                return undefined;
            }
            return (<StoryRibbonButton key={peerId} peer={peer} isArchived={isArchived}/>);
        })}
    </div>);
}
export default memo(withGlobal((global, { isArchived }) => {
    const { orderedPeerIds: { active, archived } } = global.stories;
    const usersById = global.users.byId;
    const chatsById = global.chats.byId;
    return {
        orderedPeerIds: isArchived ? archived : active,
        usersById,
        chatsById,
    };
})(StoryRibbon));
