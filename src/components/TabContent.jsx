import useAppContext from "@/hooks/useAppContext";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

import FullSpinner from "./FullSpinner";
import ErrorFallback from "./ErrorFallback";

export default function TabContent({ tab }) {
  const { dispatchAndOpenTelegramBot } = useAppContext();

  return (
    <div
      className={cn(
        "absolute inset-0",
        "flex flex-col ",
        "bg-white",
        !tab.active ? "invisible" : null
      )}
    >
      {/* Open Telegram Link Button */}
      {tab.telegramLink ? (
        <button
          className="p-3 font-bold text-blue-500 border-b"
          onClick={() => dispatchAndOpenTelegramBot(tab.telegramLink)}
        >
          Open Bot
        </button>
      ) : null}

      {/* Content */}
      <div className="flex flex-col min-w-0 min-h-0 overflow-auto grow">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<FullSpinner />}>{tab.component}</Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
