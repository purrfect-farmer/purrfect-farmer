import defaultSettings from "@/defaultSettings";
import toast from "react-hot-toast";
import farmerTabs, { TelegramWeb } from "@/farmerTabs";
import { createElement } from "react";
import { delay, postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useMessagePort from "./useMessagePort";
import useSettings from "./useSettings";
import useSocket from "./useSocket";
import useSocketDispatchCallback from "./useSocketDispatchCallback";
import useValuesMemo from "./useValuesMemo";

export const defaultOpenedTabs = () => [{ ...farmerTabs[0], active: true }];

export default function useCore() {
  const { settings, hasRestoredSettings, configureSettings } = useSettings();
  const socket = useSocket(settings.syncServer);
  const messaging = useMessagePort();

  const preferredTelegramWebVersion =
    settings.preferredTelegramWebVersion ||
    defaultSettings.preferredTelegramWebVersion;
  const [openedTabs, setOpenedTabs] = useState(defaultOpenedTabs);

  /** Open Telegram Link Interval Ref */
  const openTelegramLinkIntervalRef = useRef(null);

  /** Drops List */
  const drops = useMemo(
    () =>
      farmerTabs.filter(
        (item) => !["app", "telegram-web-k", "telegram-web-a"].includes(item.id)
      ),
    [farmerTabs]
  );

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

  /** Set Active Tab */
  const [setActiveTab, dispatchAndSetActiveTab] = useSocketDispatchCallback(
    "core.set-active-tab",
    (id) => {
      pushTab(farmerTabs.find((item) => item.id === id));
    },
    [farmerTabs, pushTab],
    /** Socket */
    socket
  );

  const [resetTabs, dispatchAndResetTabs] = useSocketDispatchCallback(
    "core.reset-tabs",
    () => {
      setOpenedTabs(defaultOpenedTabs);
    },
    [setOpenedTabs],
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
    },
    [setOpenedTabs],
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
      if (settings.openTelegramWebWithinFarmer) {
        dispatchAndSetActiveTab(`telegram-web-${v}`);
      } else {
        dispatchAndNavigateToTelegramWeb(v);
      }
    },
    [settings, dispatchAndSetActiveTab, dispatchAndNavigateToTelegramWeb]
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

  const closeOtherBots = useCallback(() => {
    const ports = getMiniAppPorts();
    const farmerBotPortName = `mini-app:${import.meta.env.VITE_APP_BOT_HOST}`;

    if (ports.some((port) => port.name === farmerBotPortName)) {
      ports
        .filter((port) => port.name !== farmerBotPortName)
        .forEach((port) => {
          postPortMessage(port, {
            action: "close-bot",
          });
        });
    } else {
      ports.slice(0, -1).forEach((port) => {
        postPortMessage(port, {
          action: "close-bot",
        });
      });
    }
  }, [getMiniAppPorts]);

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
        /** Remove All Listeners */
        eventNames.forEach((name) =>
          messaging.handler.removeAllListeners(name)
        );

        /** Post Message */
        postPortMessage(port, {
          action: "open-farmer-bot",
        });
      };

      /** Add Handler */
      messaging.handler.once(
        `port-connected:telegram-web-${version}`,
        capturePort
      );

      /** Find Telegram Web Tab */
      const tab = farmerTabs.find(
        (item) => item.id === `telegram-web-${version}`
      );

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
      farmerTabs,
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

        return new Promise((resolve, reject) => {
          /** Bot TelegramWeb Action */
          const botTelegramWebAppAction = `set-telegram-web-app:${
            import.meta.env.VITE_APP_BOT_HOST
          }`;

          /** Clear Previous Interval */
          clearInterval(openTelegramLinkIntervalRef.current);

          /** Remove Previous Handler */
          messaging.handler.removeAllListeners(botTelegramWebAppAction);

          /** Handle Farmer Bot Web App */
          const handleFarmerBotWebApp = (message, port) => {
            /** Clear Interval */
            clearInterval(openTelegramLinkIntervalRef.current);

            /** Off Listener */
            messaging.handler.removeAllListeners(botTelegramWebAppAction);

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
              openFarmerBot(version, force);
            };

            /** Add Handler */
            messaging.handler.once(
              botTelegramWebAppAction,
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

          /** Open Telegram Web */
          openNewTelegramWeb();
        });
      },
      [
        openedTabs,
        openFarmerBot,
        setActiveTab,
        preferredTelegramWebVersion,
        getFarmerBotPort,
        messaging.ports,
        messaging.handler,
      ],
      /** Socket */
      socket
    );

  /** Join Telegram Link */
  const joinTelegramLink = useCallback(
    async (url, version = preferredTelegramWebVersion, force = false) => {
      try {
        /** Open Telegram Link */
        await openTelegramLink(url, version, force);

        /** Little Delay */
        await delay(1000);

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
    [messaging.ports, preferredTelegramWebVersion, openTelegramLink]
  );

  return useValuesMemo({
    /** Data */
    drops,
    settings,
    hasRestoredSettings,
    socket,
    messaging,

    /** App Methods */
    shutdown,
    reloadApp,
    configureSettings,
    openNewTab,
    openExtensionsPage,
    getFarmerBotPort,
    closeOtherBots,
    getMiniAppPorts,
    dispatchAndShutdown,
    dispatchAndReloadApp,
    dispatchAndConfigureSettings,

    /** Telegram Web */
    openFarmerBot,
    openTelegramLink,
    openTelegramWeb,
    joinTelegramLink,
    navigateToTelegramWeb,
    dispatchAndOpenFarmerBot,
    dispatchAndOpenTelegramLink,
    dispatchAndNavigateToTelegramWeb,

    /** Tabs */
    openedTabs,
    pushTab,
    setActiveTab,
    reloadTab,
    resetTabs,
    closeTab,
    closeFarmerTabs,
    dispatchAndPushTab,
    dispatchAndSetActiveTab,
    dispatchAndReloadTab,
    dispatchAndCloseTab,
    dispatchAndResetTabs,
    dispatchAndCloseFarmerTabs,
  });
}
