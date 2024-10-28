import useAppContext from "@/hooks/useAppContext";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
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
  const { openTelegramLink } = useAppContext();

  const [openBot, dispatchAndOpenBot] = useSocketDispatchCallback(
    /**Main */
    useCallback(async () => {
      openTelegramLink(tab.telegramLink);
    }, [openTelegramLink, tab.telegramLink]),

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
        [`open-bot:${tab.id}`]: () => {
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
