import useAppContext from "@/hooks/useAppContext";
import useFarmerAutoProcess from "@/drops/notpixel/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMessageHandlers from "@/hooks/useMessageHandlers";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, isBotURL, postPortMessage } from "@/lib/utils";
import { useEffect } from "react";
import { useMemo } from "react";

import NotgramIcon from "../assets/images/icon.png?format=webp&w=80";

export default function NotgramFarmer() {
  const { setActiveTab, settings, joinTelegramLink } = useAppContext();
  const { id, port, host } = useFarmerContext();
  const process = useProcessLock("notgram.tasks");

  /** Handle Message */
  useMessageHandlers(
    useMemo(
      () => ({
        [`custom-message:${host}`]: (message) => {
          const { action, data } = message.data;
          switch (action) {
            /** Open Telegram Link */
            case "handle-link":
              const { url } = data;

              /** Not a bot */
              if (!isBotURL(url)) {
                joinTelegramLink(url);
              }

              break;

            /** Completed Tasks */
            case "completed-tasks":
              process.stop();
              setActiveTab(id);
              break;
          }
        },
      }),
      [id, host, joinTelegramLink, setActiveTab, process.stop]
    )
  );

  /** Auto-Start  */
  useFarmerAutoProcess("tasks", true, process.start);

  /** Send Message to Port */
  useEffect(() => {
    postPortMessage(port, {
      action: process.started ? "custom:start-tasks" : "custom:stop-tasks",
    }).then(() => {
      setActiveTab(
        process.started
          ? `telegram-web-${settings.preferredTelegramWebVersion}`
          : id
      );
    });
  }, [
    id,
    process.started,
    port,
    setActiveTab,
    settings.preferredTelegramWebVersion,
  ]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-center gap-2">
        <img
          src={NotgramIcon}
          alt="Notgram Farmer"
          className="w-8 h-8 rounded-lg"
        />
        <h1 className="font-bold">Notgram Farmer</h1>
      </div>

      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "px-4 py-2 text-black rounded-lg",
          !process.started ? "bg-notgram-gold-500" : "bg-red-500"
        )}
      >
        {!process.started ? "Start Tasks" : "Stop Tasks"}
      </button>
    </div>
  );
}
