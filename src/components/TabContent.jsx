import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { ErrorBoundary } from "react-error-boundary";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClipboard,
} from "react-icons/hi2";
import { Suspense, memo } from "react";
import { cn } from "@/lib/utils";

import ErrorFallback from "./ErrorFallback";
import FullSpinner from "./FullSpinner";

const TabContentButton = memo(function (props) {
  return (
    <button
      {...props}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full",
        "bg-neutral-100 dark:bg-neutral-700",
        "hover:bg-neutral-200 dark:hover:bg-neutral-600",
        props.className
      )}
    />
  );
});

export default memo(function TabContent({ tab }) {
  const { openURL, dispatchAndOpenTelegramBot } = useAppContext();
  const tabURL = ["telegram-web-k", "telegram-web-a"].includes(tab.id)
    ? `https://web.telegram.org/${tab.id.at(-1)}`
    : tab?.telegramWebApp?.initLocationHref;

  return (
    <div
      className={cn(
        "absolute inset-0",
        "flex flex-col",
        !tab.active ? "invisible" : null
      )}
    >
      {/* Open Telegram Link Button */}
      {tab.telegramLink ? (
        <button
          className="p-3 font-bold text-blue-500 border-b dark:text-blue-300 dark:border-neutral-700"
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

      {/* Open Telegram Link Button */}
      {tabURL ? (
        <div className="flex items-center justify-center gap-2 p-2 border-t dark:border-neutral-700">
          {/* Open URL */}
          <TabContentButton onClick={() => openURL(tabURL)}>
            <HiOutlineArrowTopRightOnSquare className="w-4 h-4" /> Open URL
          </TabContentButton>

          {/* Copy URL */}
          <TabContentButton
            onClick={() => {
              copy(tabURL) && toast.success("Copied URL!");
            }}
          >
            <HiOutlineClipboard className="w-4 h-4" /> Copy URL
          </TabContentButton>
        </div>
      ) : null}
    </div>
  );
});
