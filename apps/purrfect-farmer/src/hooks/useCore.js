import BrowserIcon from "@/assets/images/browser.png?w=80&format=webp";
import axios from "axios";
import md5 from "md5";
import toast from "react-hot-toast";
import tabs, { Browser, TelegramWeb, farmers } from "@/core/tabs";
import { createElement } from "react";
import { delay, getWindowCoords, postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useDeepCompareMemo } from "use-deep-compare";
import { useMemo } from "react";
import { useState } from "react";

import useAccountContext from "./useAccountContext";
import useCloudAuth from "./useCloudAuth";
import useCloudTelegramSession from "./useCloudTelegramSession";
import useLocalTelegramSession from "./useLocalTelegramSession";
import useMessagePort from "./useMessagePort";
import useMirroredCallback from "./useMirroredCallback";
import useSettings from "./useSettings";
import useSharedContext from "./useSharedContext";
import useTelegramClient from "./useTelegramClient";
import useUserAgent from "./useUserAgent";
import useValuesMemo from "./useValuesMemo";
import defaultSharedSettings from "@/core/defaultSharedSettings";

export const BOT_TELEGRAM_WEB_APP_ACTION = `set-telegram-web-app:${
  import.meta.env.VITE_APP_BOT_HOST
}`;

export const defaultOpenedTabs = () => [{ ...tabs[0], active: true }];

export default function useCore() {
  /** Shared Context */
  const shared = useSharedContext();

  /** Account */
  const account = useAccountContext();

  /** Destructure Shared */
  const {
    mirror,
    updateAccount,
    removeAccount,
    sharedSettings,
    updateSharedSettings,
    configureSharedSettings,
  } = shared;

  /** Settings */
  const { settings, updateSettings, configureSettings, restoreSettings } =
    useSettings();

  /** Local Telegram Session */
  const [localTelegramSession, setLocalTelegramSession] =
    useLocalTelegramSession();

  /** Cloud Telegram Session */
  const [cloudTelegramSession, setCloudTelegramSession] =
    useCloudTelegramSession();

  /** Farmer Mode */
  const farmerMode =
    settings.farmerMode === "session" && localTelegramSession !== null
      ? "session"
      : "web";

  /** User Agent */
  const userAgent = useUserAgent();

  /** CloudAuth */
  const cloudAuth = useCloudAuth();

  /** Cloud Backend */
  const cloudBackend = useMemo(
    () =>
      axios.create({
        baseURL: settings.cloudServer,
        headers: {
          common: {
            Authorization: cloudAuth.token ? `Bearer ${cloudAuth.token}` : null,
          },
        },
      }),
    [settings.cloudServer, cloudAuth.token]
  );

  /** Seeker Backend */
  const seekerBackend = useMemo(
    () =>
      axios.create({
        baseURL: settings.seekerServer,
      }),
    [settings.seekerServer]
  );

  const telegramClient = useTelegramClient(farmerMode, localTelegramSession);
  const messaging = useMessagePort(account.active);

  const preferredTelegramWebVersion =
    sharedSettings.preferredTelegramWebVersion ||
    defaultSharedSettings.preferredTelegramWebVersion;
  const [openedTabs, setOpenedTabs] = useState(defaultOpenedTabs);

  /** Drops Status */
  const dropsStatus = useDeepCompareMemo(() => {
    return {
      ...settings.dropsStatus,
      ...Object.fromEntries(
        farmers
          .filter((item) => settings.dropsStatus[item.id] === undefined)
          .map((item) => [item.id, true])
      ),
    };
  }, [farmers, settings.dropsStatus]);

  /** Drops Order */
  const dropsOrder = useDeepCompareMemo(
    () =>
      Array.from(
        new Set([
          /** New Drops */
          ...farmers
            .filter((item) => !settings.dropsOrder.includes(item.id))
            .map((item) => item.id),

          /** Current Drops Order */
          ...settings.dropsOrder,
        ])
      ),
    [farmers, settings.dropsOrder]
  );

  /** Ordered Drops */
  const orderedDrops = useDeepCompareMemo(
    () =>
      farmers
        .slice()
        .sort((a, b) => dropsOrder.indexOf(a.id) - dropsOrder.indexOf(b.id))
        .filter((item) => item.rating >= settings.farmersRating),
    [farmers, dropsOrder, settings.farmersRating]
  );

  /** Drops */
  const drops = useDeepCompareMemo(
    () => orderedDrops.filter((item) => dropsStatus[item.id] === true),
    [orderedDrops, dropsStatus]
  );

  /* ===== HELPERS ===== */

  const [pushTab, dispatchAndPushTab] = useMirroredCallback(
    "core.push-tab",
    (tab, override = false) => {
      setOpenedTabs((previous) => {
        if (typeof tab === "string") {
          if (previous.some((item) => item.id === tab)) {
            return previous.map((item) =>
              item.id === tab
                ? { ...item, active: true }
                : { ...item, active: false }
            );
          } else {
            return previous;
          }
        } else {
          if (previous.some((item) => item.id === tab.id)) {
            /** Push Update */
            return previous.map((item) =>
              item.id === tab.id
                ? { ...(override ? tab : item), active: true }
                : { ...item, active: false }
            );
          } else {
            return [
              ...previous.map((item) => ({ ...item, active: false })),
              { ...tab, active: true, reloadedAt: Date.now() },
            ];
          }
        }
      });
    },
    [setOpenedTabs]
  );

  /** Update Tab */
  const [updateTab, dispatchAndUpdateTab] = useMirroredCallback(
    "core.update-tab",
    (tabId, data) => {
      setOpenedTabs((previous) => {
        return previous.map((item) =>
          item.id === tabId ? { ...item, ...data } : item
        );
      });
    },
    [setOpenedTabs]
  );

  /** Set Active Tab */
  const [setActiveTab, dispatchAndSetActiveTab] = useMirroredCallback(
    "core.set-active-tab",
    (id) => {
      pushTab(
        id.startsWith("browser") ? id : tabs.find((item) => item.id === id)
      );
    },
    [tabs, pushTab]
  );

  const [resetTabs, dispatchAndResetTabs] = useMirroredCallback(
    "core.reset-tabs",
    () => {
      /** Reset Tabs */
      setOpenedTabs(defaultOpenedTabs);
    },
    [setOpenedTabs]
  );

  const [closeFarmerTabs, dispatchAndCloseFarmerTabs] = useMirroredCallback(
    "core.close-farmer-tabs",
    () => {
      setOpenedTabs((prev) =>
        prev.filter((item) =>
          ["app", "telegram-web-k", "telegram-web-a"].includes(item.id)
        )
      );
    },
    [setOpenedTabs]
  );

  const [reloadTab, dispatchAndReloadTab] = useMirroredCallback(
    "core.reload-tab",
    (id) => {
      setOpenedTabs((previous) => {
        const newTabs = previous.map((item) =>
          item.id === id ? { ...item, reloadedAt: Date.now() } : item
        );

        return newTabs;
      });
    },
    [setOpenedTabs]
  );

  const [closeTab, dispatchAndCloseTab] = useMirroredCallback(
    "core.close-tab",
    (id) => {
      setOpenedTabs((previous) => {
        if (previous.some((tab) => tab.id === id)) {
          const previousIndex = previous.findIndex((tab) => tab.id === id);

          const newTabs = previous
            .filter((item) => item.id !== id)
            .map((item, index) => ({
              ...item,
              active: index === Math.max(previousIndex - 1, 0),
            }));

          return newTabs;
        } else {
          return previous;
        }
      });
    },
    [setOpenedTabs]
  );

  /** Open New Tab */
  const openNewTab = useCallback(async () => {
    await chrome?.windows?.create({
      url: "chrome://newtab",
      state: "maximized",
      focused: true,
    });
  }, []);

  /** Open Extensions Page */
  const openExtensionsPage = useCallback(async () => {
    await chrome?.windows?.create({
      url: "chrome://extensions",
      state: "maximized",
      focused: true,
    });
  }, []);

  /** Shutdown */
  const [shutdown, dispatchAndShutdown] = useMirroredCallback(
    "core.shutdown",
    () => {
      window.close();
    },
    []
  );

  /** Reload App */
  const [reloadApp, dispatchAndReloadApp] = useMirroredCallback(
    "core.reload-app",
    async (reloadExtension = false) => {
      window.location.reload();

      if (reloadExtension) {
        chrome.runtime.reload();
      }
    },
    []
  );

  /** Dispatch and Configure Shared Settings */
  const [, dispatchAndConfigureSharedSettings] = useMirroredCallback(
    "core.configure-shared-settings",
    configureSharedSettings,
    [configureSharedSettings]
  );

  /** Dispatch And Update Shared Settings */
  const [, dispatchAndUpdateSharedSettings] = useMirroredCallback(
    "core.update-shared-settings",
    updateSharedSettings,
    [updateSharedSettings]
  );

  /** Dispatch and Configure Settings */
  const [, dispatchAndConfigureSettings] = useMirroredCallback(
    "core.configure-settings",
    configureSettings,
    [configureSettings]
  );

  /** Dispatch and Update Settings */
  const [, dispatchAndUpdateSettings] = useMirroredCallback(
    "core.update-settings",
    updateSettings,
    [updateSettings]
  );

  /** Restore Settings */
  const [, dispatchAndRestoreSettings] = useMirroredCallback(
    "core.restore-settings",
    restoreSettings,
    [restoreSettings]
  );

  /** Open URL */
  const [openURL, dispatchAndOpenURL] = useMirroredCallback(
    "core.open-url",
    (url) =>
      chrome?.windows?.create({
        url,
      }),
    []
  );

  /** Navigate to Telegram Web */
  const [navigateToTelegramWeb, dispatchAndNavigateToTelegramWeb] =
    useMirroredCallback(
      "core.navigate-to-telegram-web",
      async (v) => {
        const tabs = await chrome?.tabs?.query({
          active: true,
          currentWindow: true,
        });

        await chrome?.tabs?.update(tabs[0].id, {
          url: `https://gram.purrfectfarmer.com/${v}?account=${account.id}`,
          active: true,
        });
      },
      [account.id]
    );

  /** Open Telegram Web */
  const openTelegramWeb = useCallback(
    (v) => {
      dispatchAndSetActiveTab(`telegram-web-${v}`);
    },
    [dispatchAndSetActiveTab]
  );

  const getFarmerBotPort = useCallback(
    () =>
      messaging.ports
        .values()
        .find(
          (port) =>
            port.name === `mini-app:${import.meta.env.VITE_APP_BOT_HOST}`
        ),
    [messaging.ports]
  );

  const getMiniAppPorts = useCallback(
    () =>
      messaging.ports
        .values()
        .filter((port) => port.name.startsWith("mini-app:"))
        .toArray(),
    [messaging.ports]
  );

  /** Launch In-App Browser */
  const [launchInAppBrowser, dispatchAndLaunchInAppBrowser] =
    useMirroredCallback(
      "core.launch-in-app-browser",
      async ({ id, url, title, icon, embedInNewWindow }) => {
        if (settings.miniAppInNewWindow || embedInNewWindow) {
          try {
            if (import.meta.env.VITE_WHISKER) {
              window.open(url);
            } else {
              /** Get Coords */
              const coords = await getWindowCoords();

              await chrome.windows.create({
                ...coords,
                type: "popup",
                focused: true,
                url,
              });
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          /** Push the tab */
          pushTab(
            {
              id: `browser-${id}`,
              title,
              icon,
              component: createElement(Browser, {
                url,
              }),
              reloadedAt: Date.now(),
            },
            true
          );
        }
      },
      [settings.miniAppInNewWindow, pushTab]
    );

  const closeOtherBots = useCallback(async () => {
    const ports = getMiniAppPorts();
    const farmerBotPortName = `mini-app:${import.meta.env.VITE_APP_BOT_HOST}`;

    if (ports.some((port) => port.name === farmerBotPortName)) {
      ports
        .filter((port) => port.name !== farmerBotPortName)
        .forEach((port) =>
          postPortMessage(port, {
            action: "close-bot",
          })
        );
    } else {
      ports
        .slice(1)
        .reverse()
        .forEach((port) =>
          postPortMessage(port, {
            action: "close-bot",
          })
        );
    }

    /** Close Telegram WebK Popups */
    const telegramWebKPort = messaging.ports
      .values()
      .find((port) => port.name === "telegram-web-k");

    if (telegramWebKPort) {
      postPortMessage(telegramWebKPort, {
        action: "close-other-popups",
      });
    }
  }, [getMiniAppPorts, messaging.ports]);

  /** Open Farmer Bot */
  const [openFarmerBot, dispatchAndOpenFarmerBot] = useMirroredCallback(
    "core.open-farmer-bot",
    async (version) => {
      /** Find Telegram Web Tab */
      const tab = tabs.find((item) => item.id === `telegram-web-${version}`);

      /** Push the tab */
      pushTab(
        {
          ...tab,
          component: createElement(TelegramWeb, {
            version,
            tgaddr: import.meta.env.VITE_APP_BOT_MINI_APP,
          }),
          reloadedAt: Date.now(),
        },
        true
      );
    },
    [pushTab]
  );

  /** Open Telegram Link */
  const [openTelegramLink, dispatchAndOpenTelegramLink] = useMirroredCallback(
    "core.open-telegram-link",
    (url, { version = preferredTelegramWebVersion } = {}) => {
      if (!url) {
        return;
      }

      /** Find Telegram Web Tab */
      const tab = tabs.find((item) => item.id === `telegram-web-${version}`);

      /** Push the tab */
      pushTab(
        {
          ...tab,
          component: createElement(TelegramWeb, {
            version,
            tgaddr: url,
          }),
          reloadedAt: Date.now(),
        },
        true
      );
    },
    [pushTab, preferredTelegramWebVersion]
  );

  /** Join Telegram Link */
  const [joinTelegramLink, dispatchAndJoinTelegramLink] = useMirroredCallback(
    "core.join-telegram-link",
    async (url, { version = preferredTelegramWebVersion } = {}) => {
      if (!url) {
        return;
      } else if (farmerMode === "session") {
        try {
          await toast.promise(
            telegramClient.ref.current.joinTelegramLink(url),
            {
              loading: "Joining...",
              success: "Joined...",
              error: "Failed to Join...",
            }
          );
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          /** Open Telegram Link */
          await openTelegramLink(url, { version });

          /** Delay */
          await delay(2000);

          /** Get Port */
          const telegramWebPort = messaging.ports
            .values()
            .find((port) => port.name === `telegram-web-${version}`);

          /** Join Conversation */
          if (telegramWebPort) {
            postPortMessage(telegramWebPort, {
              action: "join-conversation",
            });
          }
        } catch (e) {
          console.error(e);
        }
      }

      /** Extra Delay */
      await delay(5000);
    },
    [farmerMode, openTelegramLink, preferredTelegramWebVersion, messaging.ports]
  );

  /** Open Telegram Bot */
  const [openTelegramBot, dispatchAndOpenTelegramBot] = useMirroredCallback(
    "core.open-telegram-bot",
    async (
      url,
      {
        version = preferredTelegramWebVersion,
        browserId,
        browserTitle,
        browserIcon,
        embedWebPage = true,
        embedInNewWindow = false,
        forceWebview = false,
      } = {}
    ) => {
      try {
        /** Is Short App */
        const isShortApp = /^(http|https):\/\/t\.me\/[^\/]+\/.+/.test(url);

        /** Should it use Webview? */
        const shouldUseWebview = forceWebview || isShortApp;

        if (
          shouldUseWebview &&
          farmerMode === "session" &&
          embedWebPage === true &&
          settings.enableInAppBrowser === true
        ) {
          toast.promise(
            (async function () {
              const webview = await telegramClient.ref.current.getWebview(url);

              await launchInAppBrowser({
                id: browserId || md5(new URL(url).host),
                icon: browserIcon || BrowserIcon,
                title: browserTitle || "Web App",
                url: webview.url,
                embedInNewWindow,
              });
            })(),
            {
              loading: "Getting WebPage...",
              success: "Opened WebPage!",
              error: "Failed to Open WebPage!",
            }
          );
        } else {
          /** Open Telegram Link */
          await openTelegramLink(url, { version });

          if (forceWebview && isShortApp === false) {
            /** Wait */
            await delay(1000);

            /** Get Port */
            const telegramWebPort = messaging.ports
              .values()
              .find((port) => port.name === `telegram-web-${version}`);

            /** Open Webview Bot */
            if (telegramWebPort) {
              postPortMessage(telegramWebPort, {
                action: "open-webview-bot",
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    [
      pushTab,
      farmerMode,
      messaging.ports,
      settings.enableInAppBrowser,
      settings.miniAppInNewWindow,
      preferredTelegramWebVersion,
      openTelegramLink,
      launchInAppBrowser,
    ]
  );

  /** Update Active Account */
  const updateActiveAccount = useCallback(
    (data) => {
      updateAccount(account.id, data);
    },
    [account.id, updateAccount]
  );

  /** Remove Active Account */
  const removeActiveAccount = useCallback(() => {
    removeAccount(account.id);
  }, [account.id, removeAccount]);

  return useValuesMemo({
    /** Data */
    ...shared,
    account,
    farmers,
    drops,
    dropsStatus,
    dropsOrder,
    orderedDrops,
    settings,
    farmerMode,

    mirror,
    telegramClient,
    cloudAuth,
    messaging,
    cloudBackend,
    seekerBackend,
    userAgent,
    localTelegramSession,
    cloudTelegramSession,
    preferredTelegramWebVersion,

    /** App Methods */
    shutdown,
    reloadApp,
    restoreSettings,
    updateSettings,
    configureSettings,
    openURL,
    openNewTab,
    openExtensionsPage,
    getFarmerBotPort,
    closeOtherBots,
    getMiniAppPorts,
    launchInAppBrowser,
    updateActiveAccount,
    removeActiveAccount,
    setLocalTelegramSession,
    setCloudTelegramSession,
    dispatchAndOpenURL,
    dispatchAndShutdown,
    dispatchAndReloadApp,
    dispatchAndUpdateSettings,
    dispatchAndConfigureSettings,
    dispatchAndRestoreSettings,
    dispatchAndUpdateSharedSettings,
    dispatchAndConfigureSharedSettings,
    dispatchAndLaunchInAppBrowser,

    /** Telegram Web */
    openFarmerBot,
    openTelegramLink,
    openTelegramWeb,
    joinTelegramLink,
    openTelegramBot,
    navigateToTelegramWeb,
    dispatchAndOpenFarmerBot,
    dispatchAndOpenTelegramBot,
    dispatchAndOpenTelegramLink,
    dispatchAndJoinTelegramLink,
    dispatchAndNavigateToTelegramWeb,

    /** Tabs */
    openedTabs,
    pushTab,
    updateTab,
    setActiveTab,
    reloadTab,
    resetTabs,
    closeTab,
    closeFarmerTabs,
    dispatchAndPushTab,
    dispatchAndUpdateTab,
    dispatchAndSetActiveTab,
    dispatchAndReloadTab,
    dispatchAndCloseTab,
    dispatchAndResetTabs,
    dispatchAndCloseFarmerTabs,
  });
}
