import { useState } from "../../../lib/teact/teact.js";
import { memo } from "../../../lib/teact/teact.js";
import { ChatCreationProgress } from "../../../types/index.js";
import { getActions, withGlobal } from "../../../global/index.js";
import { selectChat, selectTabState } from "../../../global/selectors/index.js";
import useHistoryBack from "../../../hooks/useHistoryBack.js";
import useLang from "../../../hooks/useLang.js";
import useLastCallback from "../../../hooks/useLastCallback.js";
import Icon from "../../common/icons/Icon.js";
import AvatarEditable from "../../ui/AvatarEditable.js";
import FloatingActionButton from "../../ui/FloatingActionButton.js";
import InputText from "../../ui/InputText.js";
import Spinner from "../../ui/Spinner.js";
const NewDiscussionGroup = ({
  chat,
  onClose,
  isActive,
  creationProgress,
  creationError,
}) => {
  const { createChannel } = getActions();
  const lang = useLang();
  useHistoryBack({
    isActive,
    onBack: onClose,
  });
  const [title, setTitle] = useState(
    lang("NewDiscussionChatTitle", { name: chat?.title })
  );
  const [photo, setPhoto] = useState();
  const [error, setError] = useState();
  const isLoading = creationProgress === ChatCreationProgress.InProgress;
  const handleTitleChange = useLastCallback((e) => {
    const { value } = e.currentTarget;
    const newValue = value.trimStart();
    setTitle(newValue);
    if (newValue !== value) {
      e.currentTarget.value = newValue;
    }
  });
  const renderedError =
    (creationError && lang("NewChatTitleEmptyError")) ||
    (error !== lang("NewChatTitleEmptyError") &&
    error !== lang("NewChannelTitleEmptyError")
      ? error
      : undefined);
  const handleCreateGroup = useLastCallback(() => {
    if (!title.length) {
      setError(lang("NewChatTitleEmptyError"));
      return;
    }
    if (!chat) return;
    createChannel({
      discussionChannelId: chat.id,
      title,
      photo,
      isSuperGroup: true,
    });
  });
  return (
    <div className="Management">
      <div className="panel-content custom-scroll">
        <div className="NewChat">
          <div className="NewChat-inner step-2">
            <AvatarEditable onChange={setPhoto} title={lang("AddPhoto")} />
            <InputText
              value={title}
              onChange={handleTitleChange}
              label={lang("GroupName")}
              error={
                error === lang("NewChatTitleEmptyError") ||
                error === lang("NewChannelTitleEmptyError")
                  ? error
                  : undefined
              }
            />

            {renderedError && <p className="error">{renderedError}</p>}
          </div>

          <FloatingActionButton
            isShown={title.length !== 0}
            onClick={handleCreateGroup}
            disabled={isLoading}
            ariaLabel={lang("DiscussionCreateGroup")}
          >
            {isLoading ? (
              <Spinner color="white" />
            ) : (
              <Icon name="arrow-right" />
            )}
          </FloatingActionButton>
        </div>
      </div>
    </div>
  );
};
export default memo(
  withGlobal((global, { chatId }) => {
    const { progress: creationProgress, error: creationError } =
      selectTabState(global).chatCreation || {};
    const chat = selectChat(global, chatId);
    return {
      chat,
      creationProgress,
      creationError,
    };
  })(NewDiscussionGroup)
);
