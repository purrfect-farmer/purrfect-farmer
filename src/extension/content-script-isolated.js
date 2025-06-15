import "./bridge/bridge-isolated";
import "./telegram-web/telegram-web-isolated";
import { getUserAgent, uuid } from "@/lib/utils";
import {
  decryptData,
  encryptData,
  watchTelegramMiniApp,
} from "./content-script-utils";
import { setupMiniAppToolbar } from "./mini-app/mini-app-toolbar-isolated";

if (location.host !== "web.telegram.org") {
  /** Initial Location Href */
  const INITIAL_LOCATION = location.href;

  watchTelegramMiniApp(initialize);

  /** Connect window message */
  function connectWindowMessage(data, callback, once = true) {
    /** Generate ID */
    const id = data.id || uuid();

    /**
     * @param {MessageEvent} ev
     */
    const respond = (ev) => {
      try {
        if (
          ev.source === window &&
          ev.data?.id === id &&
          ev.data?.type === "response"
        ) {
          if (once) {
            window.removeEventListener("message", respond);
          }
          callback(decryptData(ev.data.payload));
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener("message", respond);
    window.postMessage(
      {
        id,
        type: "request",
        payload: encryptData(data),
      },
      "*"
    );
  }

  /** Post window message */
  function postWindowMessage(data) {
    return new Promise((resolve) => {
      connectWindowMessage(data, resolve);
    });
  }

  /** Open Telegram Link */
  async function openTelegramLink({ id, url }) {
    return await postWindowMessage({
      id,
      action: "open-telegram-link",
      data: {
        url,
      },
    });
  }

  /** Update User-Agent */
  async function updateUserAgent() {
    const userAgent = await getUserAgent();

    return await postWindowMessage({
      action: "set-user-agent",
      data: {
        userAgent,
      },
    });
  }

  /** Get Telegram WebApp */
  async function getTelegramWebApp() {
    return await postWindowMessage({
      action: "get-telegram-web-app",
    });
  }

  /** Close Bot */
  async function closeBot({ id }) {
    return await postWindowMessage({
      id,
      action: "close-bot",
    });
  }

  /** Initialize */
  function initialize() {
    /** Connect to Messaging */
    const port = chrome.runtime.connect(chrome.runtime.id, {
      name: `mini-app:${location.host}`,
    });

    /** Dispatch TelegramWebApp */
    const dispatchTelegramWebApp = async (data) => {
      try {
        port.postMessage({
          action: `set-telegram-web-app:${location.host}`,
          data: {
            host: location.host,
            telegramWebApp: {
              ...data,
              initLocationHref: INITIAL_LOCATION,
            },
          },
        });
      } catch (e) {
        console.error(e);
      }
    };

    /** Listen for TelegramWebApp */
    const listenForTelegramWeb = (ev) => {
      if (ev.source === window && ev.data?.type === "init") {
        window.removeEventListener("message", listenForTelegramWeb);
        dispatchTelegramWebApp(decryptData(ev.data?.payload));
      }
    };

    /** Listen for Port Message */
    const listenForPortMessage = (ev) => {
      if (ev.source === window && ev.data?.type === "port") {
        try {
          port.postMessage({
            action: `custom-message:${location.host}`,
            data: decryptData(ev.data?.payload),
          });
        } catch (e) {
          console.error(e);
        }
      }
    };

    /** Set Port */
    port.onMessage?.addListener(async (message) => {
      const { id, action, data } = message;
      const reply = (data) => {
        port.postMessage({
          id,
          data,
        });
      };

      switch (action) {
        case `get-telegram-web-app:${location.host}`:
          const telegramWebApp = await getTelegramWebApp();
          dispatchTelegramWebApp(telegramWebApp);
          break;

        case "open-telegram-link":
          await openTelegramLink({ id, ...data });
          try {
            reply(true);
          } catch (e) {
            console.error(e);
          }
          break;

        case "close-bot":
          await closeBot({ id });
          try {
            reply(true);
          } catch (e) {
            console.error(e);
          }
          break;

        default:
          connectWindowMessage(
            message,
            (response) => {
              try {
                return reply(response);
              } catch (e) {
                console.error(e);
              }
            },
            false
          );
          break;
      }
    });

    /** Update User-Agent */
    updateUserAgent();

    /** Listen for TelegramWebApp */
    window.addEventListener("message", listenForTelegramWeb);

    /** Listen for Port Message */
    window.addEventListener("message", listenForPortMessage);

    /** Setup Mini-App Toolbar */
    setupMiniAppToolbar(port);
  }
}
