import TopicIcon from "./TopicIcon";
import buildClassName from "../../util/buildClassName";
import renderText from "./helpers/renderText";
import styles from "./ChatForumLastMessage.module.scss";
import useOldLang from "../../hooks/useOldLang";
import { REM } from "./helpers/mediaDimensions";
import { getActions } from "../../global";
import { getIsMobile } from "../../hooks/useAppLayout";
import { getOrderedTopics } from "../../global/helpers";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "../../lib/teact/teact";
import { useFastClick } from "../../hooks/useFastClick";
const NO_CORNER_THRESHOLD = Number(REM);
const MAX_TOPICS = 3;

const ChatForumLastMessage = ({
  chat,
  topics,
  renderLastMessage,
  observeIntersection,
}) => {
  const { openThread } = getActions();
  const lastMessageRef = useRef();
  const mainColumnRef = useRef();
  const lang = useOldLang();
  const [lastActiveTopic, ...otherTopics] = useMemo(() => {
    if (!topics) {
      return [];
    }
    return getOrderedTopics(Object.values(topics), undefined, true).slice(
      0,
      MAX_TOPICS
    );
  }, [topics]);
  const [isReversedCorner, setIsReversedCorner] = useState(false);
  const [overwrittenWidth, setOverwrittenWidth] = useState(undefined);
  const {
    handleClick: handleOpenTopicClick,
    handleMouseDown: handleOpenTopicMouseDown,
  } = useFastClick((e) => {
    if (lastActiveTopic.unreadCount === 0 || chat.isForumAsMessages) return;
    e.stopPropagation();
    e.preventDefault();
    openThread({
      chatId: chat.id,
      threadId: lastActiveTopic.id,
      shouldReplaceHistory: true,
      noForumTopicPanel: getIsMobile(),
    });
  });
  useEffect(() => {
    const lastMessageElement = lastMessageRef.current;
    const mainColumnElement = mainColumnRef.current;
    if (!lastMessageElement || !mainColumnElement) return;
    const lastMessageWidth = lastMessageElement.offsetWidth;
    const mainColumnWidth = mainColumnElement.offsetWidth;
    if (Math.abs(lastMessageWidth - mainColumnWidth) < NO_CORNER_THRESHOLD) {
      setOverwrittenWidth(Math.max(lastMessageWidth, mainColumnWidth));
    } else {
      setOverwrittenWidth(undefined);
    }
    setIsReversedCorner(lastMessageWidth > mainColumnWidth);
  }, [lastActiveTopic, renderLastMessage]);
  return (
    <div
      className={buildClassName(
        styles.root,
        isReversedCorner && styles.reverseCorner,
        overwrittenWidth && styles.overwrittenWidth
      )}
      dir={lang.isRtl ? "rtl" : undefined}
      style={
        overwrittenWidth
          ? `--overwritten-width: ${overwrittenWidth}px`
          : undefined
      }
    >
      {lastActiveTopic && (
        <div className={styles.titleRow}>
          <div
            className={buildClassName(
              styles.mainColumn,
              lastActiveTopic.unreadCount && styles.unread
            )}
            ref={mainColumnRef}
            onClick={handleOpenTopicClick}
            onMouseDown={handleOpenTopicMouseDown}
          >
            <TopicIcon
              topic={lastActiveTopic}
              observeIntersection={observeIntersection}
            />
            <div className={styles.title}>
              {renderText(lastActiveTopic.title)}
            </div>
            {!overwrittenWidth && isReversedCorner && (
              <div className={styles.afterWrapper}>
                <div className={styles.after} />
              </div>
            )}
          </div>

          <div className={styles.otherColumns}>
            {otherTopics.map((topic) => (
              <div
                className={buildClassName(
                  styles.otherColumn,
                  topic.unreadCount && styles.unread
                )}
                key={topic.id}
              >
                <TopicIcon
                  topic={topic}
                  className={styles.otherColumnIcon}
                  observeIntersection={observeIntersection}
                />
                <span className={styles.otherColumnTitle}>
                  {renderText(topic.title)}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.ellipsis} />
        </div>
      )}
      {!lastActiveTopic && (
        <div className={buildClassName(styles.titleRow, styles.loading)}>
          {lang("Loading")}
        </div>
      )}
      <div
        className={buildClassName(
          styles.lastMessage,
          lastActiveTopic?.unreadCount && styles.unread
        )}
        ref={lastMessageRef}
        onClick={handleOpenTopicClick}
        onMouseDown={handleOpenTopicMouseDown}
      >
        {renderLastMessage()}
        {!overwrittenWidth && !isReversedCorner && (
          <div className={styles.afterWrapper}>
            <div className={styles.after} />
          </div>
        )}
      </div>
    </div>
  );
};
export default memo(ChatForumLastMessage);
