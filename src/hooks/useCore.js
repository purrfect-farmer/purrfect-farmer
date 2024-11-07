import farmerTabs, { TelegramWeb } from "@/farmerTabs";
import { createElement } from "react";
import { postPortMessage } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";
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
      (version) => {
        const tab = farmerTabs.find(
          (item) => item.id === `telegram-web-${version}`
        );

        /** Capture Port */
        async function capturePort(message, port) {
          messaging.removeMessageHandlers({
            [`set-port:telegram-web-${version}`]: capturePort,
          });

          postPortMessage(port, {
            action: "open-farmer-bot",
          });
        }

        messaging.addMessageHandlers({
          [`set-port:telegram-web-${version}`]: capturePort,
        });

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
        pushTab,
        messaging.ports,
        messaging.addMessageHandlers,
        messaging.removeMessageHandlers,
      ]
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

          const postTelegramLink = (port, tabId) =>
            postPortMessage(port, {
              action: "open-telegram-link",
              data: { url },
            }).then(() => {
              setActiveTab(tabId);
            });

          const telegramWeb = openedTabs.find((tab) =>
            ["telegram-web-k", "telegram-web-a"].includes(tab.id)
          );

          let miniApps = messaging.ports
            .values()
            .filter((port) => port.name.startsWith("mini-app:"))
            .toArray();

          if (!telegramWeb || !miniApps.length) {
            /** Open Farmer Bot */
            openFarmerBot("k");

            const handleFarmerBotWebApp = (message, port) => {
              /** Remove Handler */
              messaging.removeMessageHandlers({
                [`set-telegram-web-app:${import.meta.env.VITE_APP_BOT_HOST}`]:
                  handleFarmerBotWebApp,
              });

              /** Post the Link */
              postTelegramLink(port, "telegram-web-k");
            };

            /** Add Handler */
            messaging.addMessageHandlers({
              [`set-telegram-web-app:${import.meta.env.VITE_APP_BOT_HOST}`]:
                handleFarmerBotWebApp,
            });

            return;
          }

          /** Close Other Bots */
          if (settings.closeOtherBots) {
            const farmerBotPortName = `mini-app:${
              import.meta.env.VITE_APP_BOT_HOST
            }`;
            const farmerBotPort = miniApps.find(
              (port) => port.name === farmerBotPortName
            );

            if (farmerBotPort) {
              miniApps
                .filter((port) => port.name !== farmerBotPortName)
                .forEach((port) => {
                  postPortMessage(port, {
                    action: "close-bot",
                  });
                });

              /** Reset Port List */
              miniApps = [farmerBotPort];
            } else {
              /** Remove Previous Ports */
              miniApps.slice(0, -1).forEach((port) => {
                postPortMessage(port, {
                  action: "close-bot",
                });
              });

              /** Reset Port List */
              miniApps = miniApps.slice(-1);
            }
          }

          /** Post Message to First Port */
          if (miniApps.length) {
            postTelegramLink(miniApps[0], telegramWeb.id);
          }
        },
        [
          openedTabs,
          openFarmerBot,
          messaging.ports,
          messaging.addMessageHandlers,
          messaging.removeMessageHandlers,
          setActiveTab,
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
