import toast from "react-hot-toast";
import farmerTabs, { TelegramWeb } from "@/farmerTabs";
import { createElement } from "react";
import { postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useMessagePort from "./useMessagePort";
import useSettings from "./useSettings";
import useSocket from "./useSocket";
import useSocketDispatchCallback from "./useSocketDispatchCallback";
import useSocketHandlers from "./useSocketHandlers";
import useValuesMemo from "./useValuesMemo";

export const defaultOpenedTabs = () => [{ ...farmerTabs[0], active: true }];

export default function useCore() {
  const { settings, configureSettings } = useSettings();
  const socket = useSocket(settings.syncServer);
  const messaging = useMessagePort();

  const [openedTabs, setOpenedTabs] = useState(defaultOpenedTabs);

  /** Open Farmer Bot State Ref */
  const openFarmerBotStateRef = useRef({ handler: null });

  /** Open Telegram Link State Ref */
  const openTelegramLinkStateRef = useRef({ interval: null, handler: null });

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
    /** Main */
    useCallback(
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
      [setOpenedTabs]
    ),

    /** Dispatch */
    useCallback(
      (socket, drop) =>
        socket.dispatch({
          action: "app.set-active-tab",
          data: {
            id: drop.id,
          },
        }),
      []
    ),
    /** Socket */
    socket
  );

  /** Set Active Tab */
  const [setActiveTab, dispatchAndSetActiveTab] = useSocketDispatchCallback(
    /** Main */
    useCallback(
      (id) => {
        pushTab(farmerTabs.find((item) => item.id === id));
      },
      [farmerTabs, pushTab]
    ),

    /** Dispatch */
    useCallback(
      (socket, id) =>
        socket.dispatch({
          action: "app.set-active-tab",
          data: {
            id,
          },
        }),
      []
    ),
    /** Socket */
    socket
  );

  const [resetTabs, dispatchAndResetTabs] = useSocketDispatchCallback(
    /** Main */
    useCallback(() => {
      setOpenedTabs(defaultOpenedTabs);
    }, [setOpenedTabs]),

    /** Dispatch */
    useCallback((socket) => {
      socket.dispatch({
        action: "app.reset-tabs",
      });
    }, []),
    /** Socket */
    socket
  );

  const [reloadTab, dispatchAndReloadTab] = useSocketDispatchCallback(
    /** Main */
    useCallback(
      (id) => {
        setOpenedTabs((previous) => {
          const newTabs = previous.map((item) =>
            item.id === id ? { ...item, reloadedAt: Date.now() } : item
          );

          return newTabs;
        });
      },
      [setOpenedTabs]
    ),

    /** Dispatch */
    useCallback((socket, id) => {
      socket.dispatch({
        action: "app.reload-tab",
        data: {
          id,
        },
      });
    }, []),
    /** Socket */
    socket
  );

  const [closeTab, dispatchAndCloseTab] = useSocketDispatchCallback(
    /** Main */
    useCallback(
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
      [setOpenedTabs]
    ),
    /** Dispatch */
    useCallback((socket, id) => {
      socket.dispatch({
        action: "app.close-tab",
        data: {
          id,
        },
      });
    }, []),
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
    /** Main */
    useCallback(() => {
      window.close();
    }, []),

    /** Dispatch */
    useCallback(
      (socket) =>
        socket.dispatch({
          action: "app.shutdown",
        }),
      []
    ),
    /** Socket */
    socket
  );

  /** Open Farmer in Separate Window */
  const [reloadApp, dispatchAndReloadApp] = useSocketDispatchCallback(
    /** Main */
    useCallback(() => {
      window.location.reload();
    }, []),

    /** Dispatch */
    useCallback(
      (socket) =>
        socket.dispatch({
          action: "app.reload-app",
        }),
      []
    ),
    /** Socket */
    socket
  );

  /** Configure Settings */
  const [, dispatchAndConfigureSettings] = useSocketDispatchCallback(
    /** Configure Settings */
    configureSettings,

    /** Dispatch */
    useCallback(
      (socket, k, v) =>
        socket.dispatch({
          action: "app.configure-settings",
          data: {
            key: k,
            value: v,
          },
        }),
      []
    ),
    /** Socket */
    socket
  );

  /** Navigate to Telegram Web */
  const [navigateToTelegramWeb, dispatchAndNavigateToTelegramWeb] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(
        (v) =>
          chrome?.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
            chrome?.tabs?.update(tabs[0].id, {
              url: `https://web.telegram.org/${v}`,
              active: true,
            });
          }),
        []
      ),

      /** Dispatch */
      useCallback(
        (socket, v) =>
          socket.dispatch({
            action: "app.navigate-to-telegram-web",
            data: {
              version: v,
            },
          }),
        []
      ),
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

  const [openFarmerBot, dispatchAndOpenFarmerBot] = useSocketDispatchCallback(
    /** Main */
    useCallback(
      async (version) => {
        /** Remove Previous Handler */
        if (openFarmerBotStateRef.current.handler) {
          ["k", "a"].map((item) => {
            messaging.handler.off(
              `port-connected:telegram-web-${item}`,
              openFarmerBotStateRef.current.handler
            );
          });
        }

        /** Capture Port */
        const capturePort = (openFarmerBotStateRef.current.handler =
          async function (port) {
            /** Reset Handler */
            openFarmerBotStateRef.current.handler = null;

            /** Post Message */
            postPortMessage(port, {
              action: "open-farmer-bot",
            });
          });

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
      [farmerTabs, pushTab, messaging.handler, messaging.removeMessageHandlers]
    ),

    /** Dispatch */
    useCallback(
      (socket, version) =>
        socket.dispatch({
          action: "app.open-farmer-bot",
          data: {
            version,
          },
        }),
      []
    ),
    /** Socket */
    socket
  );

  /** Open Telegram Link */
  const [openTelegramLink, dispatchAndOpenTelegramLink] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(
        async (url) => {
          if (!url) {
            return;
          }
          /** Bot TelegramWeb Action */
          const botTelegramWebAppAction = `set-telegram-web-app:${
            import.meta.env.VITE_APP_BOT_HOST
          }`;

          /** Clear Previous Interval */
          clearInterval(openTelegramLinkStateRef.current.interval);

          /** Remove Previous Handler */
          if (openTelegramLinkStateRef.current.handler) {
            messaging.handler.off(
              botTelegramWebAppAction,
              openTelegramLinkStateRef.current.handler
            );
          }

          /** Handle Farmer Bot Web App */
          const handleFarmerBotWebApp =
            (openTelegramLinkStateRef.current.handler = (message, port) => {
              /** Clear Interval */
              clearInterval(openTelegramLinkStateRef.current.interval);

              /** Reset */
              openTelegramLinkStateRef.current.interval = null;
              openTelegramLinkStateRef.current.handler = null;

              /** Post the Link */
              postTelegramLink(port, "telegram-web-k");
            });

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
              openFarmerBot("k");
            };

            /** Add Handler */
            messaging.handler.once(
              botTelegramWebAppAction,
              handleFarmerBotWebApp
            );

            /** Reopen the bot */
            openTelegramLinkStateRef.current.interval = setInterval(
              reOpenFarmerBot,
              30000
            );

            /** Open Farmer Bot */
            openFarmerBot("k");
          };

          /** Telegram Web */
          const telegramWeb = openedTabs.find((tab) =>
            ["telegram-web-k", "telegram-web-a"].includes(tab.id)
          );

          /** Mini App Ports */
          const miniAppPorts = messaging.ports
            .values()
            .filter((port) => port.name.startsWith("mini-app:"))
            .toArray();

          if (!telegramWeb || !miniAppPorts.length) {
            return openNewTelegramWeb();
          }

          /** Close Other Bots */
          let portToPostMessage;

          if (settings.closeOtherBots) {
            const farmerBotPortName = `mini-app:${
              import.meta.env.VITE_APP_BOT_HOST
            }`;
            const farmerBotPort = miniAppPorts.find(
              (port) => port.name === farmerBotPortName
            );

            if (farmerBotPort) {
              miniAppPorts
                .filter((port) => port.name !== farmerBotPortName)
                .forEach((port) => {
                  postPortMessage(port, {
                    action: "close-bot",
                  });
                });

              /** Reset Port List */
              portToPostMessage = farmerBotPort;
            } else {
              /** Remove Previous Ports */
              miniAppPorts.slice(0, -1).forEach((port) => {
                postPortMessage(port, {
                  action: "close-bot",
                });
              });

              /** Reset Port List */
              portToPostMessage = miniAppPorts.at(-1);
            }
          }

          /** Post Message to First Port */
          if (portToPostMessage) {
            postTelegramLink(portToPostMessage, telegramWeb.id);
          }
        },
        [
          openedTabs,
          openFarmerBot,
          setActiveTab,
          messaging.ports,
          messaging.handler,
          settings.closeOtherBots,
        ]
      ),

      /** Dispatch */
      useCallback(
        (socket, url) =>
          socket.dispatch({
            action: "app.open-telegram-link",
            data: {
              url,
            },
          }),
        []
      ),
      /** Socket */
      socket
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "app.shutdown": () => {
          shutdown();
        },

        "app.reload-app": () => {
          reloadApp();
        },

        "app.open-farmer-bot": (command) => {
          openFarmerBot(command.data.version);
        },

        "app.open-telegram-link": (command) => {
          openTelegramLink(command.data.url);
        },

        "app.configure-settings": (command) => {
          configureSettings(command.data.key, command.data.value);
        },

        "app.set-active-tab": (command) => {
          setActiveTab(command.data.id);
        },

        "app.reset-tabs": () => {
          resetTabs();
        },

        "app.reload-tab": (command) => {
          reloadTab(command.data.id);
        },

        "app.close-tab": (command) => {
          closeTab(command.data.id);
        },

        "app.navigate-to-telegram-web": (command) => {
          navigateToTelegramWeb(command.data.version);
        },
      }),
      [
        shutdown,
        reloadApp,
        openFarmerBot,
        openTelegramLink,
        setActiveTab,
        reloadTab,
        resetTabs,
        closeTab,
        configureSettings,
        navigateToTelegramWeb,
      ]
    ),
    /** Socket */
    socket
  );

  return useValuesMemo({
    /** Data */
    drops,
    settings,
    socket,
    messaging,

    /** App Methods */
    shutdown,
    reloadApp,
    configureSettings,
    openNewTab,
    openExtensionsPage,
    dispatchAndShutdown,
    dispatchAndReloadApp,
    dispatchAndConfigureSettings,

    /** Telegram Web */
    openFarmerBot,
    openTelegramLink,
    openTelegramWeb,
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
    dispatchAndPushTab,
    dispatchAndSetActiveTab,
    dispatchAndReloadTab,
    dispatchAndCloseTab,
    dispatchAndResetTabs,
  });
}
