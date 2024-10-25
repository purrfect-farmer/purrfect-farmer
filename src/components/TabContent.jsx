import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { cn, postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";

import FullSpinner from "./FullSpinner";

const fallbackRender = ({ error, resetErrorBoundary }) => {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 p-4 grow"
    >
      <h4 className="text-3xl">Oops</h4>
      <p className="font-bold text-center text-neutral-500">
        Something went wrong
      </p>
      <button
        onClick={resetErrorBoundary}
        className="w-full max-w-xs px-4 py-2 text-white bg-black rounded-lg"
      >
        Reset
      </button>
    </div>
  );
};

export default function TabContent({ tab }) {
  const {
    openedTabs,
    setActiveTab,
    messaging: { ports },
    settings,
  } = useAppContext();

  const [openBot, dispatchAndOpenBot] = useSocketDispatchCallback(
    /**Main */
    useCallback(async () => {
      const telegramWeb = openedTabs.find((tab) =>
        ["telegram-web-k", "telegram-web-a"].includes(tab.id)
      );

      if (!telegramWeb) {
        toast.dismiss();
        return toast.error("Please open Telegram Web");
      }

      const miniApps = ports
        .values()
        .filter((port) => port.name.startsWith("mini-app:"))
        .toArray();

      if (!miniApps.length) {
        toast.dismiss();
        return toast.error("No Telegram Bot Running..");
      }

      /** Post Message to First Port */
      postPortMessage(miniApps[0], {
        action: "open-telegram-link",
        data: { url: tab.telegramLink },
      }).then(() => {
        setActiveTab(telegramWeb.id);
      });

      /** Close Other Bots */
      if (settings.closeOtherBots) {
        miniApps.slice(1).forEach((port) => {
          postPortMessage(port, {
            action: "close-bot",
          });
        });
      }
    }, [
      openedTabs,
      ports,
      tab.telegramLink,
      setActiveTab,
      settings.closeOtherBots,
    ]),

    /** Dispatch */
    useCallback(
      (socket) =>
        socket.dispatch({
          action: `open-bot:${tab.id}`,
        }),
      [tab.id]
    )
  );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        [`open-bot:${tab.id}`]: (command) => {
          openBot();
        },
      }),
      [tab.id, openBot]
    )
  );

  return (
    <div
      className={cn(
        "absolute inset-0",
        "flex flex-col ",
        "bg-white",
        !tab.active ? "invisible" : null
      )}
    >
      {tab.telegramLink ? (
        <button
          className="p-3 font-bold text-blue-500 border-b"
          onClick={dispatchAndOpenBot}
        >
          Open Bot
        </button>
      ) : null}
      {/* Content */}
      <div className="flex flex-col min-w-0 min-h-0 overflow-auto grow">
        <ErrorBoundary fallbackRender={fallbackRender}>
          <Suspense fallback={<FullSpinner />}>{tab.component}</Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
