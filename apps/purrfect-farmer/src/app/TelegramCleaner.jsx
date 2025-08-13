import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { HiOutlineXMark } from "react-icons/hi2";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

export default function TelegramCleaner() {
  const { farmerMode, telegramClient } = useAppContext();
  const [dialogs, setDialogs] = useState(null);

  const conversations = useMemo(
    () => dialogs?.filter((d) => d.isGroup || d.isChannel),
    [dialogs]
  );

  useEffect(() => {
    if (farmerMode !== "session") return;
    telegramClient.ref.current.getDialogs().then(setDialogs);
  }, [farmerMode, telegramClient.ref, setDialogs]);

  const leaveConversation = (conversationId) => {
    toast
      .promise(telegramClient.ref.current.leaveConversation(conversationId), {
        loading: "Leaving conversation...",
        success: "Left conversation successfully!",
        error: (error) => `Failed to leave conversation: ${error.message}`,
      })
      .then(() => {
        setDialogs((prev) =>
          prev.filter((dialog) => dialog.id !== conversationId)
        );
      })
      .catch((error) => {
        console.error("Failed to leave conversation:", error);
      });
  };

  console.log(dialogs);
  console.log(conversations);

  return (
    <div className="p-2 flex flex-col gap-2">
      {dialogs === null ? (
        <p className="text-center">Fetching Dialogs...</p>
      ) : (
        conversations.map((conversation) => (
          <div key={conversation.id} className="flex items-center gap-2">
            <h3 className="font-semibold grow min-w-0 truncate bg-neutral-100 dark:bg-neutral-700 rounded-lg px-4 py-2">
              {conversation.title}
            </h3>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => leaveConversation(conversation.id)}
            >
              <HiOutlineXMark className="size-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
