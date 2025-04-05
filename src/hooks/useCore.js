import axios from "axios";
import defaultSettings from "@/core/defaultSettings";
import toast from "react-hot-toast";
import tabs, { Browser, TelegramWeb, farmers } from "@/core/tabs";
import { createElement } from "react";
import { delay, isBotURL, postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useDeepCompareMemo } from "use-deep-compare";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useCloudAuth from "./useCloudAuth";
import useCloudTelegramSession from "./useCloudTelegramSession";
import useLocalTelegramSession from "./useLocalTelegramSession";
import useMessagePort from "./useMessagePort";
import useMirror from "./useMirror";
import useMirroredCallback from "./useMirroredCallback";
import useSettings from "./useSettings";
import useTelegramClient from "./useTelegramClient";
import useUserAgent from "./useUserAgent";
import useValuesMemo from "./useValuesMemo";

export const BOT_TELEGRAM_WEB_APP_ACTION = `set-telegram-web-app:${
  import.meta.env.VITE_APP_BOT_HOST
}`;

export const defaultOpenedTabs = () => [{ ...tabs[0], active: true }];

export default function useCore() {
  /** Settings */
  const { settings, hasRestoredSettings, configureSettings, restoreSettings } =
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
  const mirror = useMirror(settings.enableMirror, settings.mirrorServer);
  const messaging = useMessagePort();

  const preferredTelegramWebVersion =
    settings.preferredTelegramWebVersion ||
    defaultSettings.preferredTelegramWebVersion;
  const [openedTabs, setOpenedTabs] = useState(defaultOpenedTabs);

  /** Open Farmer Bot Handler Ref */
  const farmerBotHandlerRef = useRef({
    listeners: {},
  });

  /** Open Telegram Link Handler Ref */
  const telegramLinkHandlerRef = useRef({
    interval: null,
    listeners: {},
  });

  /** Drops Status */
  const dropsStatus = useDeepCompareMemo(() => {
    return {
      ...defaultSettings.dropsStatus,
      ...settings.dropsStatus,
    };
  }, [defaultSettings.dropsStatus, settings.dropsStatus]);

  /** Drops Order */
  const dropsOrder = useDeepCompareMemo(
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
  const orderedDrops = useDeepCompareMemo(
    () =>
      farmers
        .slice()
        .sort((a, b) => dropsOrder.indexOf(a.id) - dropsOrder.indexOf(b.id)),
    [farmers, dropsOrder]
  );

  /** Drops */
  const drops = useDeepCompareMemo(
    () => orderedDrops.filter((item) => dropsStatus[item.id] === true),
    [orderedDrops, dropsStatus]
  );

  /** Reset openFarmerBot Handler */
  const resetOpenFarmerBotHandler = useCallback(() => {
    /** Handler Ref */
    const ref = farmerBotHandlerRef;

    /** Remove Listeners */
    for (const event in ref.current.listeners) {
      /** Remove Listener */
      messaging.handler.removeListener(event, ref.current.listeners[event]);

      /** Delete Listener */
      delete ref.current.listeners[event];
    }
  }, [messaging.handler.removeListener]);

  /** Reset openTelegramLink Handler */
  const resetOpenTelegramLinkHandler = useCallback(() => {
    /** Handler Ref */
    const ref = telegramLinkHandlerRef;

    if (ref.current.interval) {
      /** Clear Previous Interval */
      clearInterval(ref.current.interval);

      /** Unset Interval */
      ref.current.interval = null;
    }

    /** Remove Listeners */
    for (const event in ref.current.listeners) {
      /** Remove Listener */
      messaging.handler.removeListener(event, ref.current.listeners[event]);

      /** Delete Listener */
      delete ref.current.listeners[event];
    }
  }, [messaging.handler.removeListener]);

  /** Cancel Telegram Handlers */
  const cancelTelegramHandlers = useCallback(() => {
    resetOpenFarmerBotHandler();
    resetOpenTelegramLinkHandler();
  }, [
    /** Deps */
    resetOpenFarmerBotHandler,
    resetOpenTelegramLinkHandler,
  ]);

  /** Disconnect Telegram Observers */
  const disconnectTelegramObservers = useCallback(() => {
    /** Get Ports */
    const ports = messaging.ports
      .values()
      .filter((port) =>
        ["telegram-web-k", "telegram-web-a"].includes(port.name)
      );

    for (const port of ports) {
      /** Disconnect Observers */
      postPortMessage(port, {
        action: "disconnect-observers",
      });
    }
  }, [messaging.ports]);

  /* ===== HELPERS ===== */

  const [pushTab, dispatchAndPushTab] = useMirroredCallback(
    "core.push-tab",
    (tab, override = false) => {
      setOpenedTabs((previous) => {
        if (typeof tab === "string") {
          return previous.map((item) =>
            item.id === tab
              ? { ...item, active: true }
              : { ...item, active: false }
          );
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
    [setOpenedTabs],
    /** Mirror */
    mirror
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
    [setOpenedTabs],
    /** Mirror */
    mirror
  );

  /** Set Active Tab */
  const [setActiveTab, dispatchAndSetActiveTab] = useMirroredCallback(
    "core.set-active-tab",
    (id) => {
      pushTab(
        id.startsWith("browser") ? id : tabs.find((item) => item.id === id)
      );
    },
    [tabs, pushTab],
    /** Mirror */
    mirror
  );

  const [resetTabs, dispatchAndResetTabs] = useMirroredCallback(
    "core.reset-tabs",
    () => {
      /** Cancel Handlers */
      cancelTelegramHandlers();

      /** Reset Tabs */
      setOpenedTabs(defaultOpenedTabs);
    },
    [cancelTelegramHandlers, setOpenedTabs],
    /** Mirror */
    mirror
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
    [setOpenedTabs],
    /** Mirror */
    mirror
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
    [setOpenedTabs],
    /** Mirror */
    mirror
  );

  const [closeTab, dispatchAndCloseTab] = useMirroredCallback(
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
    /** Mirror */
    mirror
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
    [],
    /** Mirror */
    mirror
  );

  /** Reload App */
  const [reloadApp, dispatchAndReloadApp] = useMirroredCallback(
    "core.reload-app",
    () => {
      window.location.reload();
    },
    [],
    /** Mirror */
    mirror
  );

  /** Configure Settings */
  const [, dispatchAndConfigureSettings] = useMirroredCallback(
    "core.configure-settings",
    /** Configure Settings */
    configureSettings,
    [configureSettings],
    /** Mirror */
    mirror
  );

  /** Restore Settings */
  const [, dispatchAndRestoreSettings] = useMirroredCallback(
    "core.restore-settings",
    /** Restore Settings */
    restoreSettings,
    [restoreSettings],
    /** Mirror */
    mirror
  );

  /** Open URL */
  const [openURL, dispatchAndOpenURL] = useMirroredCallback(
    "core.open-url",
    (url) =>
      chrome?.windows?.create({
        url,
      }),
    [],
    /** Mirror */
    mirror
  );

  /** Navigate to Telegram Web */
  const [navigateToTelegramWeb, dispatchAndNavigateToTelegramWeb] =
    useMirroredCallback(
      "core.navigate-to-telegram-web",
      (v) =>
        chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
          chrome?.tabs?.update(tabs[0].id, {
            url: `https://web.telegram.org/${v}`,
            active: true,
          });
        }),
      [],
      /** Mirror */
      mirror
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

  /** Open Farmer Bot */
  const [openFarmerBot, dispatchAndOpenFarmerBot] = useMirroredCallback(
    "core.open-farmer-bot",
    async (version, { force = false } = {}) => {
      /** Reset Previous Handler */
      resetOpenFarmerBotHandler();

      /** Handler Ref */
      const ref = farmerBotHandlerRef;

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
      /** Telegram Web Event Name */
      const telegramWebEventName = `port-connected:telegram-web-${version}`;

      /** Capture Port */
      const capturePort = async function (port) {
        /** Post Message */
        postPortMessage(port, {
          action: "open-farmer-bot",
        });
      };

      /** Store Listener */
      ref.current.listeners[telegramWebEventName] = capturePort;

      /** Capture Port every time Telegram Web Opens */
      messaging.handler.on(telegramWebEventName, capturePort);

      /** Store Listener */
      ref.current.listeners[BOT_TELEGRAM_WEB_APP_ACTION] =
        resetOpenFarmerBotHandler;

      /** Reset Handler Once the Bot Opens */
      messaging.handler.once(
        BOT_TELEGRAM_WEB_APP_ACTION,
        resetOpenFarmerBotHandler
      );

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
      resetOpenFarmerBotHandler,
      messaging.handler,
      messaging.ports,
    ],
    /** Mirror */
    mirror
  );

  /** Open Telegram Link */
  const [openTelegramLink, dispatchAndOpenTelegramLink] = useMirroredCallback(
    "core.open-telegram-link",
    (url, { version = preferredTelegramWebVersion, force = false } = {}) => {
      if (!url) {
        return;
      }

      return new Promise(async (resolve, reject) => {
        /** Reset Handler */
        resetOpenTelegramLinkHandler();

        /** Disconnect Observers */
        disconnectTelegramObservers();

        /** Handler Ref */
        const ref = telegramLinkHandlerRef;

        /** Handle Farmer Bot Web App */
        const handleFarmerBotWebApp = (message, port) => {
          /** Reset Handler */
          resetOpenTelegramLinkHandler();

          /** Post the Link */
          postTelegramLink(port, `telegram-web-${version}`);

          /** Disconnect Observers */
          disconnectTelegramObservers();

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
            toast.success(`Re-Opening ${import.meta.env.VITE_APP_BOT_NAME}...`);
            openFarmerBot(version, { force: true });
          };

          /** Store Listener */
          ref.current.listeners[BOT_TELEGRAM_WEB_APP_ACTION] =
            handleFarmerBotWebApp;

          /** Register Listener */
          messaging.handler.once(
            BOT_TELEGRAM_WEB_APP_ACTION,
            handleFarmerBotWebApp
          );

          /** Re-Open the bot */
          ref.current.interval = setInterval(reOpenFarmerBot, 30000);

          /** Open Farmer Bot */
          openFarmerBot(version, { force });

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
      disconnectTelegramObservers,
      resetOpenTelegramLinkHandler,
      messaging.ports,
      messaging.handler,
      settings.closeOtherBots,
    ],
    /** Mirror */
    mirror
  );

  /** Join Telegram Link */
  const [joinTelegramLink, dispatchAndJoinTelegramLink] = useMirroredCallback(
    "core.join-telegram-link",
    async (
      url,
      { version = preferredTelegramWebVersion, force = false } = {}
    ) => {
      if (!url) {
        return;
      } else if (farmerMode === "session") {
        try {
          await toast.promise(telegramClient.joinTelegramLink(url), {
            loading: "Joining...",
            success: "Joined...",
            error: "Failed to Join...",
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          /** Open Telegram Link */
          await openTelegramLink(url, { version, force });

          /** Get Port */
          const telegramWebPort = messaging.ports
            .values()
            .find((port) => port.name === `telegram-web-${version}`);

          /** Join Conversation */
          postPortMessage(telegramWebPort, {
            action: "join-conversation",
          });
        } catch {}
      }

      /** Extra Delay */
      await delay(5000);
    },
    [
      farmerMode,
      openTelegramLink,
      preferredTelegramWebVersion,
      messaging.ports,
      telegramClient.joinTelegramLink,
    ],
    /** Mirror */
    mirror
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
        embedWebPage = false,
        force = false,
      } = {}
    ) => {
      try {
        if (
          farmerMode === "session" &&
          embedWebPage === true &&
          settings.enableInAppBrowser === true
        ) {
          toast.promise(
            (async function () {
              const webview = await telegramClient.getWebview(url);

              /** Push the tab */
              pushTab(
                {
                  id: `browser-${browserId}`,
                  title: browserTitle,
                  icon: browserIcon,
                  component: createElement(Browser, {
                    url: webview.url,
                  }),
                  reloadedAt: Date.now(),
                },
                true
              );
            })(),
            {
              loading: "Getting WebPage...",
              success: "Opened WebPage!",
              error: "Failed to Open WebPage!",
            }
          );
        } else {
          /** Is Mini App Start Page */
          const isStartPage = !/(http|https):\/\/t\.me\/[^\/]+\/.+/.test(url);

          /** Open Telegram Link */
          await openTelegramLink(url, { version, force: isStartPage || force });

          if (isStartPage) {
            /** Get Port */
            const telegramWebPort = messaging.ports
              .values()
              .find((port) => port.name === `telegram-web-${version}`);

            /** Wait */
            await delay(1000);

            /** Open Webview Bot */
            postPortMessage(telegramWebPort, {
              action: "open-webview-bot",
            });
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
      telegramClient.getEntity,
      telegramClient.getWebview,
      preferredTelegramWebVersion,
      openTelegramLink,
      disconnectTelegramObservers,
    ],
    /** Mirror */
    mirror
  );

  return useValuesMemo({
    /** Data */
    farmers,
    drops,
    dropsStatus,
    dropsOrder,
    orderedDrops,
    settings,
    farmerMode,
    hasRestoredSettings,
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
    configureSettings,
    openNewTab,
    openURL,
    openExtensionsPage,
    getFarmerBotPort,
    closeOtherBots,
    getMiniAppPorts,
    setLocalTelegramSession,
    setCloudTelegramSession,
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
