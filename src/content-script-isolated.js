import { decryptData, encryptData } from "./content-script-utils";
import { uuid } from "./lib/utils";

(function () {
  if (location.hash.includes("tgWebAppData")) {
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

    const closeBot = async ({ id }) => {
      return await postWindowMessage({
        id,
        action: "close-bot",
      });
    };

    /** Get the Telegram Web App */
    const getTelegramWebApp = async () => {
      return await postWindowMessage({
        action: "get-telegram-web-app",
      });
    };

    /** Connect to Messaging */
    const port = chrome.runtime.connect(chrome.runtime.id, {
      name: `mini-app:${location.host}`,
    });

    /** Set Port */
    port.onMessage.addListener(async (message) => {
      const { id, action, data } = message;
      switch (action) {
        case `get-port:${location.host}`:
          port.postMessage({
            action: `set-port:${location.host}`,
          });
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

    document.addEventListener("readystatechange", () => {
      if (document.readyState === "complete") {
        let timeout;
        let telegramWebApp;

        /** Dispatch the TelegramWebApp */
        const dispatchTelegramWebApp = async () => {
          if (!telegramWebApp) {
            telegramWebApp = await getTelegramWebApp();
          }

          try {
            if (telegramWebApp) {
              port.postMessage({
                action: `set-telegram-web-app:${location.host}`,
                data: {
                  host: location.host,
                  telegramWebApp,
                },
              });
            }
          } catch {}

          /** Dispatch again... */
          timeout = setTimeout(dispatchTelegramWebApp, 500);
        };

        /** Terminate Web App Dispatch */
        const terminateWebAppDispatch = (message) => {
          if (message.action === "terminate-web-app-dispatch") {
            clearTimeout(timeout);
            port.onMessage.removeListener(terminateWebAppDispatch);
          }
        };

        /** Add Listener to Stop Dispatching */
        port.onMessage.addListener(terminateWebAppDispatch);

        /** Send the WebApp Data */
        dispatchTelegramWebApp();
      }
    });
  }
})();
