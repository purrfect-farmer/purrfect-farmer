import Tabs from "@/components/Tabs";
import TelegramLogo from "@/assets/images/telegram-logo.svg";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { HiOutlineXMark } from "react-icons/hi2";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";
import Container from "@/components/Container";

const ConversationIcon = ({ conversation }) => {
  const { telegramClient } = useAppContext();
  const ref = telegramClient.ref;
  const [src, setSrc] = useState(null);

  const loadImage = useCallback(async () => {
    /** @type {import("@purrfect/shared/lib/BaseTelegramWebClient").default} */
    const client = ref.current;

    const media = await client.execute(() =>
      client.downloadProfilePhoto(conversation.entity, {
        isBig: false,
      })
    );
    const base64 = media.toString("base64");
    const src = `data:image/jpeg;base64,${base64}`;

    setSrc(src);
  }, [conversation, ref, setSrc]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  return (
    <img
      src={src || TelegramLogo}
      alt={conversation.title}
      className="size-8 rounded-full"
    />
  );
};

const ConversationItem = ({ conversation, onLeave }) => {
  return (
    <div key={conversation.id} className="flex items-center gap-2">
      <ConversationIcon conversation={conversation} />

      <h3 className="font-semibold grow min-w-0 truncate bg-neutral-100 dark:bg-neutral-700 rounded-lg px-4 py-2">
        {conversation.title}
      </h3>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        onClick={() => onLeave(conversation.id.toString())}
      >
        <HiOutlineXMark className="size-4" />
      </button>
    </div>
  );
};

const ChatsCleaner = ({ isPending, conversations, onLeave }) => {
  return isPending ? (
    <p className="text-center">Fetching List...</p>
  ) : (
    <>
      <h4 className="text-center my-2">Total: {conversations.length}</h4>

      <div className="flex flex-col gap-2">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            onLeave={onLeave}
          />
        ))}
      </div>
    </>
  );
};

export default function TelegramCleaner() {
  const tabs = useMirroredTabs("telegram-cleaner", ["channels", "bots"]);

  const { farmerMode, telegramClient } = useAppContext();
  const [dialogs, setDialogs] = useState(null);
  const ref = telegramClient.ref;

  const conversations = useMemo(
    () => dialogs?.filter((d) => d.isGroup || d.isChannel),
    [dialogs]
  );

  const bots = useMemo(
    () => dialogs?.filter((d) => d.isUser && d.entity.bot),
    [dialogs]
  );

  useEffect(() => {
    if (farmerMode !== "session") return;
    /** @type {import("@purrfect/shared/lib/BaseTelegramWebClient").default} */
    const client = ref.current;

    /** Fetch Dialogs */
    client.execute(() => client.getDialogs()).then(setDialogs);
  }, [farmerMode, ref, setDialogs]);

  const [, dispatchAndLeaveConversation] = useMirroredCallback(
    "telegram-cleaner.leave-conversation",
    (conversationId) => {
      /** @type {import("@purrfect/shared/lib/BaseTelegramWebClient").default} */
      const client = ref.current;

      const conversationBigIntId = BigInt(conversationId);
      const existingDialog = dialogs.find(
        (dialog) => dialog.id.value === conversationBigIntId
      );

      if (!existingDialog) {
        console.error("Conversation not found:", conversationId);
        return;
      }

      const isBot = existingDialog.isUser && existingDialog.entity.bot;
      const toastMessages = isBot
        ? {
            loading: "Removing Bot...",
            success: "Removed bot successfully!",
            error: (error) => `Failed to remove bot: ${error.message}`,
          }
        : {
            loading: "Leaving conversation...",
            success: "Left conversation successfully!",
            error: (error) => `Failed to leave conversation: ${error.message}`,
          };

      toast
        .promise(
          isBot
            ? client.deleteAndBlockBot(existingDialog.entity)
            : client.leaveConversation(existingDialog.entity),
          {
            loading: toastMessages.loading,
            success: toastMessages.success,
            error: toastMessages.error,
          }
        )
        .then(() => {
          setDialogs((prev) =>
            prev.filter((dialog) => dialog !== existingDialog)
          );
        })
        .catch((error) => {
          console.error("Failed to leave conversation:", error);
        });
    },
    [ref, dialogs, setDialogs]
  );

  console.log(dialogs);
  console.log(conversations);

  if (farmerMode !== "session") {
    return (
      <Container className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Telegram Cleaner</h2>
        <p>
          Telegram Cleaner is only available in <strong>Session</strong> mode.
          Please switch to Session mode to access this feature.
        </p>
      </Container>
    );
  }

  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto gap-0">
      <div className="grow overflow-auto">
        <Container className="flex flex-col p-2">
          <Tabs.Content value="channels">
            <ChatsCleaner
              isPending={dialogs === null}
              conversations={conversations}
              onLeave={dispatchAndLeaveConversation}
            />
          </Tabs.Content>

          <Tabs.Content value="bots">
            <ChatsCleaner
              isPending={dialogs === null}
              conversations={bots}
              onLeave={dispatchAndLeaveConversation}
            />
          </Tabs.Content>
        </Container>
      </div>
    </Tabs>
  );
}
