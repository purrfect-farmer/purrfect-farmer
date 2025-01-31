import axios from "axios";
import defaultSettings from "@/core/defaultSettings";
import toast from "react-hot-toast";
import tabs, { TelegramWeb } from "@/core/tabs";
import { createElement } from "react";
import { delay, isBotURL, postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useMessagePort from "./useMessagePort";
import useSettings from "./useSettings";
import useSocket from "./useSocket";
import useSocketDispatchCallback from "./useSocketDispatchCallback";
import useUserAgent from "./useUserAgent";
import useValuesMemo from "./useValuesMemo";

const BOT_TELEGRAM_WEB_APP_ACTION = `set-telegram-web-app:${
  import.meta.env.VITE_APP_BOT_HOST
}`;

export const defaultOpenedTabs = () => [{ ...tabs[0], active: true }];

export default function useCore() {
  /** Settings */
  const { settings, hasRestoredSettings, configureSettings, restoreSettings } =
    useSettings();

  /** User Agent */
  const userAgent = useUserAgent();

  /** Cloud Backend */
  const cloudBackend = useMemo(
    () =>
      axios.create({
        baseURL: settings.cloudServer,
      }),
    [settings.cloudServer]
  );

  const socket = useSocket(settings.syncServer);
  const messaging = useMessagePort();

  const preferredTelegramWebVersion =
    settings.preferredTelegramWebVersion ||
    defaultSettings.preferredTelegramWebVersion;
  const [openedTabs, setOpenedTabs] = useState(defaultOpenedTabs);

  /** Open Telegram Link Interval Ref */
  const openTelegramLinkIntervalRef = useRef(null);

  /** Farmers */
  const farmers = useMemo(
    () =>
      tabs.filter(
        (item) => !["app", "telegram-web-k", "telegram-web-a"].includes(item.id)
      ),
    [tabs]
  );

  /** Drops Status */
  const dropsStatus = useMemo(() => {
    return {
      ...defaultSettings.dropsStatus,
      ...settings.dropsStatus,
    };
  }, [defaultSettings.dropsStatus, settings.dropsStatus]);

  /** Drops Order */
  const dropsOrder = useMemo(
    () =>
      new Set([
        /** Default Drops Order */
        ...defaultSettings.dropsOrder.filter(
          (item) => !settings.dropsOrder.includes(item)
        ),
        /** Modified Drops Order */
        ...settings.dropsOrder,

        /** Others */
        ...farmers.reduce((result, item) => result.concat(item.id), []),
      ])
        .values()
        .toArray(),
    [farmers, defaultSettings.dropsOrder, settings.dropsOrder]
  );

  /** Ordered Drops */
  const orderedDrops = useMemo(
    () =>
      farmers
        .slice()
        .sort((a, b) => dropsOrder.indexOf(a.id) - dropsOrder.indexOf(b.id)),
    [farmers, dropsOrder]
  );

  /** Drops */
  const drops = useMemo(
    () => orderedDrops.filter((item) => dropsStatus[item.id] === true),
    [orderedDrops, dropsStatus]
  );

  /** Cancel Telegram Handlers */
  const cancelTelegramHandlers = useCallback(() => {
    /** Clear Interval */
    clearInterval(openTelegramLinkIntervalRef.current);

    /** Remove Telegram Web Port Handlers */
    ["k", "a"]
      .map((item) => `port-connected:telegram-web-${item}`)
      .forEach((name) => messaging.handler.removeAllListeners(name));

    /** Remove Bot Web App Action */
    messaging.handler.removeAllListeners(BOT_TELEGRAM_WEB_APP_ACTION);
  }, [messaging.handler]);

  /* ===== HELPERS ===== */

  const [pushTab, dispatchAndPushTab] = useSocketDispatchCallback(
    "core.push-tab",
    (tab, override = false) => {
      setOpenedTabs((previous) => {
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
      });
    },
    [setOpenedTabs],
    /** Socket */
    socket
  );

  /** Update Tab */
  const [updateTab, dispatchAndUpdateTab] = useSocketDispatchCallback(
    "core.update-tab",
    (tabId, data) => {
      setOpenedTabs((previous) => {
        return previous.map((item) =>
          item.id === tabId ? { ...item, ...data } : item
        );
      });
    },
    [setOpenedTabs],
    /** Socket */
    socket
  );

  /** Set Active Tab */
  const [setActiveTab, dispatchAndSetActiveTab] = useSocketDispatchCallback(
    "core.set-active-tab",
    (id) => {
      pushTab(tabs.find((item) => item.id === id));
    },
    [tabs, pushTab],
    /** Socket */
    socket
  );

  const [resetTabs, dispatchAndResetTabs] = useSocketDispatchCallback(
    "core.reset-tabs",
    () => {
      setOpenedTabs(defaultOpenedTabs);
      cancelTelegramHandlers();
    },
    [setOpenedTabs, cancelTelegramHandlers],
    /** Socket */
    socket
  );

  const [closeFarmerTabs, dispatchAndCloseFarmerTabs] =
    useSocketDispatchCallback(
      "core.close-farmer-tabs",
      () => {
        setOpenedTabs((prev) =>
          prev.filter((item) =>
            ["app", "telegram-web-k", "telegram-web-a"].includes(item.id)
          )
        );
      },
      [setOpenedTabs],
      /** Socket */
      socket
    );

  const [reloadTab, dispatchAndReloadTab] = useSocketDispatchCallback(
    "core.reload-tab",
    (id) => {
      setOpenedTabs((previous) => {
        const newTabs = previous.map((item) =>
          item.id === id ? { ...item, reloadedAt: Date.now() } : item
        );

        return newTabs;
      });
    },
    [setOpenedTabs],
    /** Socket */
    socket
  );

  const [closeTab, dispatchAndCloseTab] = useSocketDispatchCallback(
    "core.close-tab",
    (id) => {
      setOpenedTabs((previous) => {
        const previousIndex = previous.findIndex((tab) => tab.id === id);

        const newTabs = previous
          .filter((item) => item.id !== id)
          .map((item, index) => ({
            ...item,
            active: index === Math.max(previousIndex - 1, 0),
          }));

        return newTabs;
      });

      /** Cancel Telegram Handlers When Closed */
      if (["telegram-web-k", "telegram-web-a"].includes(id)) {
        cancelTelegramHandlers();
      }
    },
    [setOpenedTabs, cancelTelegramHandlers],
    /** Socket */
    socket
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
  const [shutdown, dispatchAndShutdown] = useSocketDispatchCallback(
    "core.shutdown",
    () => {
      window.close();
    },
    [],
    /** Socket */
    socket
  );

  /** Reload App */
  const [reloadApp, dispatchAndReloadApp] = useSocketDispatchCallback(
    "core.reload-app",
    () => {
      window.location.reload();
    },
    [],
    /** Socket */
    socket
  );

  /** Configure Settings */
  const [, dispatchAndConfigureSettings] = useSocketDispatchCallback(
    "core.configure-settings",
    /** Configure Settings */
    configureSettings,
    [configureSettings],
    /** Socket */
    socket
  );

  /** Restore Settings */
  const [, dispatchAndRestoreSettings] = useSocketDispatchCallback(
    "core.restore-settings",
    /** Restore Settings */
    restoreSettings,
    [restoreSettings],
    /** Socket */
    socket
  );

  /** Open URL */
  const [openURL, dispatchAndOpenURL] = useSocketDispatchCallback(
    "core.open-url",
    (url) =>
      chrome?.windows?.create({
        url,
      }),
    [],
    /** Socket */
    socket
  );

  /** Navigate to Telegram Web */
  const [navigateToTelegramWeb, dispatchAndNavigateToTelegramWeb] =
    useSocketDispatchCallback(
      "core.navigate-to-telegram-web",
      (v) =>
        chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
          chrome?.tabs?.update(tabs[0].id, {
            url: `https://web.telegram.org/${v}`,
            active: true,
          });
        }),
      [],
      /** Socket */
      socket
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

  const [openFarmerBot, dispatchAndOpenFarmerBot] = useSocketDispatchCallback(
    "core.open-farmer-bot",
    async (version, force = false) => {
      /** Event Names */
      const eventNames = ["k", "a"].map(
        (item) => `port-connected:telegram-web-${item}`
      );

      /** Remove All Listeners */
      eventNames.forEach((name) => messaging.handler.removeAllListeners(name));

      /** When Not Force */
      if (!force) {
        /** Farmer Bot is Running? */
        const farmerBotPort = getFarmerBotPort();
        if (farmerBotPort) {
          setActiveTab(`telegram-web-${version}`);
          return;
        }

        /** Other Mini App */
        const miniAppPorts = getMiniAppPorts();
        if (miniAppPorts.length) {
          setActiveTab(`telegram-web-${version}`);
          postPortMessage(miniAppPorts.at(0), {
            action: "open-telegram-link",
            data: { url: import.meta.env.VITE_APP_BOT_MINI_APP },
          });

          return;
        }
      }

      /** Capture Port */
      const capturePort = async function (port) {
        /** Post Message */
        postPortMessage(port, {
          action: "open-farmer-bot",
        });
      };

      /** Add Handler */
      messaging.handler.on(
        `port-connected:telegram-web-${version}`,
        capturePort
      );

      /** Remove All Listeners */
      messaging.handler.on(BOT_TELEGRAM_WEB_APP_ACTION, () => {
        eventNames.forEach((name) =>
          messaging.handler.removeAllListeners(name)
        );
      });

      /** Find Telegram Web Tab */
      const tab = tabs.find((item) => item.id === `telegram-web-${version}`);

      /** Push the tab */
      pushTab(
        {
          ...tab,
          component: createElement(TelegramWeb, {
            version,
            hash: `#${
              version === "k"
                ? import.meta.env.VITE_APP_BOT_USERNAME
                : import.meta.env.VITE_APP_BOT_CHAT_ID
            }`,
          }),
          reloadedAt: Date.now(),
        },
        true
      );
    },
    [
      tabs,
      setActiveTab,
      pushTab,
      getFarmerBotPort,
      getMiniAppPorts,
      messaging.handler,
      messaging.ports,
      messaging.removeMessageHandlers,
    ],
    /** Socket */
    socket
  );

  /** Open Telegram Link */
  const [openTelegramLink, dispatchAndOpenTelegramLink] =
    useSocketDispatchCallback(
      "core.open-telegram-link",
      (url, version = preferredTelegramWebVersion, force = false) => {
        if (!url) {
          return;
        }

        return new Promise(async (resolve, reject) => {
          /** Clear Previous Interval */
          clearInterval(openTelegramLinkIntervalRef.current);

          /** Remove Previous Handler */
          messaging.handler.removeAllListeners(BOT_TELEGRAM_WEB_APP_ACTION);

          /** Handle Farmer Bot Web App */
          const handleFarmerBotWebApp = (message, port) => {
            /** Clear Interval */
            clearInterval(openTelegramLinkIntervalRef.current);

            /** Off Listener */
            messaging.handler.removeAllListeners(BOT_TELEGRAM_WEB_APP_ACTION);

            /** Reset */
            openTelegramLinkIntervalRef.current = null;

            /** Post the Link */
            postTelegramLink(port, `telegram-web-${version}`);

            /** Resolve the Promise */
            resolve(true);
          };

          /** Post Telegram Link */
          const postTelegramLink = (port, tabId) =>
            postPortMessage(port, {
              action: "open-telegram-link",
              data: { url },
            }).then(() => {
              setActiveTab(tabId);
            });

          const openNewTelegramWeb = () => {
            /** Re-Open Bot */
            const reOpenFarmerBot = () => {
              toast.success(
                `Re-Opening ${import.meta.env.VITE_APP_BOT_NAME}...`
              );
              openFarmerBot(version, true);
            };

            /** Add Handler */
            messaging.handler.once(
              BOT_TELEGRAM_WEB_APP_ACTION,
              handleFarmerBotWebApp
            );

            /** Reopen the bot */
            openTelegramLinkIntervalRef.current = setInterval(
              reOpenFarmerBot,
              30000
            );

            /** Open Farmer Bot */
            openFarmerBot(version, force);

            /** Not Forced */
            if (!force) {
              /** Is it running?... */
              const farmerBotPort = getFarmerBotPort();
              if (farmerBotPort) {
                handleFarmerBotWebApp(null, farmerBotPort);
              }
            }
          };

          /** Close Other Bots */
          if (settings.closeOtherBots && isBotURL(url)) {
            closeOtherBots();
          }

          /** Open Telegram Web */
          openNewTelegramWeb();
        });
      },
      [
        openFarmerBot,
        setActiveTab,
        preferredTelegramWebVersion,
        getFarmerBotPort,
        closeOtherBots,
        messaging.ports,
        messaging.handler,
        settings.closeOtherBots,
      ],
      /** Socket */
      socket
    );

  /** Join Telegram Link */
  const [joinTelegramLink, dispatchAndJoinTelegramLink] =
    useSocketDispatchCallback(
      "core.join-telegram-link",
      async (url, version = preferredTelegramWebVersion, force = false) => {
        if (!url) {
          return;
        }

        try {
          /** Open Telegram Link */
          await openTelegramLink(url, version, force);

          /** Get Port */
          const telegramWebPort = messaging.ports
            .values()
            .find((port) => port.name === `telegram-web-${version}`);

          /** Join Conversation */
          postPortMessage(telegramWebPort, {
            action: "join-conversation",
          });

          /** Extra Delay */
          await delay(5000);
        } catch {}
      },
      [messaging.ports, preferredTelegramWebVersion, openTelegramLink],
      /** Socket */
      socket
    );

  /** Open Telegram Bot */
  const [openTelegramBot, dispatchAndOpenTelegramBot] =
    useSocketDispatchCallback(
      "core.open-telegram-bot",
      async (url, version = preferredTelegramWebVersion, force = false) => {
        try {
          /** Is Mini App Start Page */
          const isStartPage = !/https:\/\/t\.me\/[^\/]+\/.+/.test(url);

          /** Open Telegram Link */
          await openTelegramLink(url, version, isStartPage || force);

          /** Get Port */
          const telegramWebPort = messaging.ports
            .values()
            .find((port) => port.name === `telegram-web-${version}`);

          /** Abort Observers */
          postPortMessage(telegramWebPort, {
            action: "abort-observers",
          });

          if (isStartPage) {
            /** Wait */
            await delay(1000);

            /** Open Bot */
            postPortMessage(telegramWebPort, {
              action: "open-bot",
            });
          }
        } catch {}
      },
      [messaging.ports, preferredTelegramWebVersion, openTelegramLink],
      /** Socket */
      socket
    );

  return useValuesMemo({
    /** Data */
    farmers,
    drops,
    dropsStatus,
    dropsOrder,
    orderedDrops,
    settings,
    hasRestoredSettings,
    socket,
    messaging,
    cloudBackend,
    userAgent,

    /** App Methods */
    shutdown,
    reloadApp,
    configureSettings,
    openNewTab,
    openURL,
    openExtensionsPage,
    getFarmerBotPort,
    closeOtherBots,
    getMiniAppPorts,
    dispatchAndOpenURL,
    dispatchAndShutdown,
    dispatchAndReloadApp,
    dispatchAndConfigureSettings,
    dispatchAndRestoreSettings,

    /** Telegram Web */
    openFarmerBot,
    openTelegramLink,
    openTelegramWeb,
    joinTelegramLink,
    openTelegramBot,
    navigateToTelegramWeb,
    cancelTelegramHandlers,
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
