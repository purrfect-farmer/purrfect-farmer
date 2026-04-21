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
import usePrimaryFarmerLink from "@/hooks/usePrimaryFarmerLink";
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
    openTelegramLink,
    openTelegramBot,
    launchInAppBrowser,
    preferredTelegramWebVersion,
    dispatchAndOpenTelegramLink,
    dispatchAndOpenTelegramBot,
    dispatchAndLaunchInAppBrowser,
  } = useAppContext();

  /** Launch tab in-app browser */
  const launchTabInAppBrowser = tab.singleton
    ? launchInAppBrowser
    : dispatchAndLaunchInAppBrowser;

  /** Open tab telegram bot */
  const openTabTelegramBot = tab.singleton
    ? openTelegramBot
    : dispatchAndOpenTelegramBot;

  /** Open tab telegram link */
  const openTabTelegramLink = tab.singleton
    ? openTelegramLink
    : dispatchAndOpenTelegramLink;

  const { external, FarmerClass } = tab;

  const { primaryFarmerLink } = usePrimaryFarmerLink(FarmerClass?.id);

  /** Referral link */
  const { value: referralLink } = useStorageState(
    `farmer-referral-link:${tab.id}`,
    null,
  );

  const defaultLink = tab.platform === "telegram" ? tab.telegramLink : tab.link;
  const launchLink = referralLink || primaryFarmerLink || defaultLink;

  /* Open links in app-browser */
  const openLinksInAppBrowser =
    settings.enableInAppBrowser && farmerMode === "session";

  /* Should open web app */
  const shouldOpenWebApp = tab.type === "webapp" && openLinksInAppBrowser;

  /* Link button icon */
  const linkButtonIconSrc =
    external || tab.platform !== "telegram" || shouldOpenWebApp
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
        singleton: tab.singleton,
        url: FarmerClass.getUrlFromInitData(tab.initData),
      });
    } else if (tab.platform !== "telegram") {
      launchTabInAppBrowser({
        url: launchLink,
        id: tab.id,
        title: tab.title,
        icon: tab.icon,
        singleton: tab.singleton,
        embedInNewWindow: tab.embedInNewWindow,
      });
    } else if (tab.type === "webapp") {
      openTabTelegramBot(launchLink, {
        singleton: tab.singleton,
        browserId: tab.id,
        browserTitle: tab.title,
        browserIcon: tab.icon,
        embedWebPage: tab.embedWebPage,
        embedInNewWindow: tab.embedInNewWindow,
        host: tab.host,
        forceWebview: true,
      });
    } else {
      openTabTelegramLink(launchLink);
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
        {launchLink ? (
          <LinkButton onClick={openTabLink}>
            <img src={linkButtonIconSrc} className="size-5 shrink-0" />
            Open {tab.platform === "telegram" ? "Bot" : "Link"}{" "}
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
