import BrowserIcon from "@/assets/images/browser.png?w=80&format=webp";
import TabContext from "@/contexts/TabContext";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import useAppContext from "@/hooks/useAppContext";
import useStorageState from "@/hooks/useStorageState";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense, memo } from "react";
import { cn } from "@/lib/utils";

import ErrorFallback from "./ErrorFallback";
import FullSpinner from "./FullSpinner";

export default memo(function TabContent({ tab }) {
  const {
    settings,
    farmerMode,
    preferredTelegramWebVersion,
    dispatchAndOpenTelegramBot,
  } = useAppContext();

  const { value: referralLink } = useStorageState(
    `farmer-referral-link:${tab.id}`,
    null
  );

  return (
    <TabContext.Provider value={tab}>
      <div
        data-tab-id={tab.id}
        className={cn(
          "absolute inset-0",
          "flex flex-col",
          !tab.active ? "invisible" : null
        )}
      >
        {/* Open Telegram Link Button */}
        {tab.telegramLink ? (
          <button
            className={cn(
              "flex items-center justify-center gap-2",
              "h-10 font-bold",
              "text-blue-500 dark:text-blue-300",
              "border-b dark:border-neutral-700",
              "shrink-0"
            )}
            onClick={() =>
              dispatchAndOpenTelegramBot(referralLink || tab.telegramLink, {
                browserId: tab.id,
                browserTitle: tab.title,
                browserIcon: tab.icon,
                embedWebPage: tab.embedWebPage,
                embedInNewWindow: tab.embedInNewWindow,
                forceWebview: true,
              })
            }
          >
            <img
              src={
                farmerMode === "session" && settings.enableInAppBrowser
                  ? BrowserIcon
                  : preferredTelegramWebVersion === "k"
                  ? TelegramWebKIcon
                  : TelegramWebAIcon
              }
              className="size-5 shrink-0"
            />
            Open Bot {referralLink ? "(R)" : null}
          </button>
        ) : null}

        {/* Content */}
        <div className="flex flex-col min-w-0 min-h-0 overflow-auto grow">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<FullSpinner />}>{tab.component}</Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </TabContext.Provider>
  );
});
