import { Suspense, memo } from "react";

import BrowserIcon from "@/assets/images/browser.png?w=80&format=webp";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./ErrorFallback";
import FullSpinner from "./FullSpinner";
import TabContext from "@/contexts/TabContext";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import { cn } from "@/utils";
import useAppContext from "@/hooks/useAppContext";
import useStorageState from "@/hooks/useStorageState";

const LinkButton = (props) => {
  return (
    <button
      {...props}
      className={cn(
        "flex items-center justify-center gap-2",
        "h-10 font-bold",
        "text-blue-500 dark:text-blue-300",
        "border-b dark:border-neutral-700",
        "shrink-0",
      )}
    />
  );
};

export default memo(function TabContent({ tab }) {
  const {
    settings,
    farmerMode,
    launchInAppBrowser,
    preferredTelegramWebVersion,
    dispatchAndOpenTelegramLink,
    dispatchAndOpenTelegramBot,
    dispatchAndLaunchInAppBrowser,
  } = useAppContext();

  const { external, FarmerClass } = tab;

  const { value: referralLink } = useStorageState(
    `farmer-referral-link:${tab.id}`,
    null,
  );

  const openLinksInAppBrowser =
    settings.enableInAppBrowser && farmerMode === "session";

  const shouldOpenWebApp = tab.type === "webapp" && openLinksInAppBrowser;

  const linkButtonIconSrc =
    external || tab.link || shouldOpenWebApp
      ? BrowserIcon
      : preferredTelegramWebVersion === "k"
        ? TelegramWebKIcon
        : TelegramWebAIcon;

  const openTabLink = () => {
    if (external) {
      launchInAppBrowser({
        id: tab.id,
        icon: tab.icon,
        title: tab.title,
        url: FarmerClass.getUrlFromInitData(tab.initData),
      });
    } else if (tab.platform !== "telegram") {
      dispatchAndLaunchInAppBrowser({
        id: tab.id,
        url: referralLink || tab.link,
        title: tab.title,
        icon: tab.icon,
        embedInNewWindow: tab.embedInNewWindow,
      });
    } else if (tab.type === "webapp") {
      dispatchAndOpenTelegramBot(referralLink || tab.telegramLink, {
        browserId: tab.id,
        browserTitle: tab.title,
        browserIcon: tab.icon,
        embedWebPage: tab.embedWebPage,
        embedInNewWindow: tab.embedInNewWindow,
        host: tab.host,
        forceWebview: true,
      });
    } else {
      dispatchAndOpenTelegramLink(referralLink || tab.telegramLink);
    }
  };

  return (
    <TabContext.Provider value={tab}>
      <div
        data-tab-id={tab.id}
        className={cn(
          "absolute inset-0",
          "flex flex-col",
          !tab.active ? "invisible" : null,
        )}
      >
        {/* Unpublished status */}
        {tab.FarmerClass && !tab.FarmerClass.published ? (
          <div className="bg-orange-500 p-2 text-center font-bold">
            Under development
          </div>
        ) : null}

        {/* Open Telegram Link Button */}
        {tab.link || tab.telegramLink ? (
          <LinkButton onClick={openTabLink}>
            <img src={linkButtonIconSrc} className="size-5 shrink-0" />
            Open {tab.platform !== "telegram" ? "Link" : "Bot"}{" "}
            {referralLink ? "(R)" : null}
          </LinkButton>
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
