import { getUserAgent, uuid } from "@/lib/utils";

import { decryptData, encryptData } from "./content-script-utils";

if (location.hash.includes("tgWebAppData")) {
  /** Initial Location Href */
  const initLocationHref = location.href;

  const connectWindowMessage = (data, callback, once = true) => {
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
      } catch {}
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

  const updateUserAgent = async () => {
    const userAgent = await getUserAgent();

    return await postWindowMessage({
      action: "set-user-agent",
      data: {
        userAgent,
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
  const dispatchTelegramWebApp = async (data) => {
    try {
      port.postMessage({
        action: `set-telegram-web-app:${location.host}`,
        data: {
          host: location.host,
          telegramWebApp: {
            ...data,
            initLocationHref,
          },
        },
      });
    } catch {}
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
      } catch {}
    }
  };

  /** Set Port */
  port.onMessage.addListener(async (message) => {
    const { id, action, data } = message;
    switch (action) {
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
            try {
              port.postMessage({
                id,
                data: response,
              });
            } catch {}
          }
        );

        break;

      case "open-telegram-link":
        await openTelegramLink({ id, ...data });
        try {
          port.postMessage({
            id,
            data: true,
          });
        } catch {}
        break;

      case "close-bot":
        await closeBot({ id });
        try {
          port.postMessage({
            id,
            data: true,
          });
        } catch {}
        break;

      default:
        connectWindowMessage(
          message,
          (response) => {
            try {
              return port.postMessage({
                id,
                data: response,
              });
            } catch {}
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
}
