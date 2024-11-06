import { decryptData, encryptData } from "./content-script-utils";
import { uuid } from "./lib/utils";

if (location.hash.includes("tgWebAppData")) {
  const TG_WEB_SCRIPT_SRC = "https://telegram.org/js/telegram-web-app.js";

  const connectWindowMessage = (data, callback, once = true) => {
    /** Generate ID */
    const id = data.id || uuid();

    /**
     * @param {MessageEvent} ev
     */
    const respond = (ev) => {
      try {
        if (ev.data?.id === id && ev.data?.type === "response") {
          if (once) {
            window.removeEventListener("message", respond);
          }
          callback(decryptData(ev.data.payload));
        }
      } catch {}
    };

    window.addEventListener("message", respond);
    window.postMessage(
      {
        id,
        payload: encryptData(data),
      },
      "*"
    );
  };

  const postWindowMessage = (data) => {
    return new Promise((resolve) => {
      connectWindowMessage(data, resolve);
    });
  };

  const getRequestData = async ({ id, ...data }, callback) => {
    connectWindowMessage(
      {
        id,
        action: "get-request-data",
        data,
      },
      callback,
      false
    );
  };

  const openTelegramLink = async ({ id, url }) => {
    return await postWindowMessage({
      id,
      action: "open-telegram-link",
      data: {
        url,
      },
    });
  };

  const getTelegramWebApp = async () => {
    return await postWindowMessage({
      action: "get-telegram-web-app",
    });
  };

  const closeBot = async ({ id }) => {
    return await postWindowMessage({
      id,
      action: "close-bot",
    });
  };

  /** Connect to Messaging */
  const port = chrome.runtime.connect(chrome.runtime.id, {
    name: `mini-app:${location.host}`,
  });

  /** Dispatch TelegramWebApp */
  const dispatchTelegramWebApp = async (telegramWebApp) => {
    port.postMessage({
      action: `set-telegram-web-app:${location.host}`,
      data: {
        host: location.host,
        telegramWebApp,
      },
    });
  };

  /** Listen for TelegramWebApp */
  const listenForTelegramWeb = (ev) => {
    if (ev.data?.type === "init") {
      window.removeEventListener("message", listenForTelegramWeb);
      dispatchTelegramWebApp(decryptData(ev.data?.payload));
    }
  };

  /** Set Port */
  port.onMessage.addListener(async (message) => {
    const { id, action, data } = message;
    switch (action) {
      case `get-port:${location.host}`:
        port.postMessage({
          action: `set-port:${location.host}`,
        });
        break;

      case `get-telegram-web-app:${location.host}`:
        const telegramWebApp = await getTelegramWebApp();
        dispatchTelegramWebApp(telegramWebApp);
        break;

      case "get-request-data":
        getRequestData(
          {
            id,
            ...data,
          },
          (response) => {
            port.postMessage({
              id,
              data: response,
            });
          }
        );

        break;

      case "open-telegram-link":
        await openTelegramLink({ id, ...data });
        port.postMessage({
          id,
          data: true,
        });
        break;

      case "close-bot":
        await closeBot({ id });
        port.postMessage({
          id,
          data: true,
        });
        break;
    }
  });

  /** Set Port */
  port.postMessage({
    action: `set-port:${location.host}`,
  });

  /** Listen for TelegramWebApp */
  window.addEventListener("message", listenForTelegramWeb);
}
