import { memo, useCallback, useState } from "../../../lib/teact/teact";
import { getActions } from "../../../global";
import { LeftColumnContent } from "../../../types";
import { LAYERS_ANIMATION_NAME } from "../../../util/browser/windowEnvironment";
import useLastCallback from "../../../hooks/useLastCallback.js";
import Transition from "../../ui/Transition";
import NewChatStep1 from "./NewChatStep1";
import NewChatStep2 from "./NewChatStep2";
import "./NewChat.scss";
const RENDER_COUNT = Object.keys(LeftColumnContent).length / 2;
const NewChat = ({ isActive, isChannel = false, content, onReset }) => {
  const { openLeftColumnContent, setGlobalSearchQuery } = getActions();
  const [newChatMemberIds, setNewChatMemberIds] = useState([]);
  const handleNextStep = useCallback(() => {
    openLeftColumnContent({
      contentKey: isChannel
        ? LeftColumnContent.NewChannelStep2
        : LeftColumnContent.NewGroupStep2,
    });
  }, [isChannel]);
  const changeSelectedMemberIdsHandler = useLastCallback((ids) => {
    const isSelection = ids.length > newChatMemberIds.length;
    setNewChatMemberIds(ids);
    if (isSelection) {
      setGlobalSearchQuery({ query: "" });
    }
  });
  return (
    <Transition
      id="NewChat"
      name={LAYERS_ANIMATION_NAME}
      renderCount={RENDER_COUNT}
      activeKey={content}
    >
      {(isStepActive) => {
        switch (content) {
          case LeftColumnContent.NewChannelStep1:
          case LeftColumnContent.NewGroupStep1:
            return (
              <NewChatStep1
                isChannel={isChannel}
                isActive={isActive}
                selectedMemberIds={newChatMemberIds}
                onSelectedMemberIdsChange={changeSelectedMemberIdsHandler}
                onNextStep={handleNextStep}
                onReset={onReset}
              />
            );
          case LeftColumnContent.NewChannelStep2:
          case LeftColumnContent.NewGroupStep2:
            return (
              <NewChatStep2
                isChannel={isChannel}
                isActive={isStepActive && isActive}
                memberIds={newChatMemberIds}
                onReset={onReset}
              />
            );
          default:
            return undefined;
        }
      }}
    </Transition>
  );
};
export default memo(NewChat);
