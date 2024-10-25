import { decryptData, encryptData } from "./content-script-utils";

if (location.hash.includes("tgWebAppData")) {
  const requestsToWatch = new Map();

  /** Dispatch Response */
  const dispatchResponse = async (url, response) => {
    const item = requestsToWatch.get(url);

    if (item) {
      const { id, key, once } = item;

      /** Return Data */
      window.postMessage(
        {
          id,
          type: "response",
          payload: encryptData({
            key,
            response: await response,
          }),
        },
        "*"
      );

      /** Remove Watch */
      if (once) {
        requestsToWatch.delete(url);
      }
    }
  };

  /** Replace Platform */
  ["webk", "weba", "web"].forEach((platform) => {
    location.hash = location.hash.replace(
      `&tgWebAppPlatform=${platform}`,
      "&tgWebAppPlatform=android"
    );
  });

  /** Override User Agent */
  Object.defineProperty(navigator, "userAgent", {
    get: () =>
      "Mozilla/5.0 (Linux; Android 11; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Safari/537.36",
    configurable: true,
  });

  /** Override fetch and XMLHttpRequest */
  const core = {
    fetch: window.fetch.bind(window),
    XMLHttpRequest: window.XMLHttpRequest.bind(window),
    postMessage: window.postMessage.bind(window),
  };

  /** Modified XMLHttpRequest */
  const modifiedXMLHttpRequest = class extends XMLHttpRequest {
    open(...args) {
      const [, url] = args;
      let target;

      if ((target = shouldWatchRequest(url))) {
        super.addEventListener("load", () => {
          dispatchResponse(target, JSON.parse(this.responseText));
        });
      }

      return super.open(...args);
    }
  };

  /** Modified Fetch */
  const modifiedFetch = function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0].url;
    let target;

    if ((target = shouldWatchRequest(url))) {
      return core.fetch(...args).then(
        /**
         * @param {Response} response
         */
        (response) => {
          dispatchResponse(target, response.clone().json());

          return Promise.resolve(response);
        }
      );
    } else {
      return core.fetch(...args);
    }
  };

  /** Resolve URL */
  const resolveURL = (url) => new URL(url, location.href).toString();

  /** Request Pattern */
  const requestPattern = (pattern) =>
    "^" +
    [".", "?"].reduce(
      (result, item) => result.replaceAll(item, `\\${item}`),
      pattern.replaceAll("*", "[^\\/]+")
    ) +
    "$";

  /** Should Watch the request? */
  const shouldWatchRequest = (url) =>
    requestsToWatch.keys().find(
      /**
       * @param {string} key
       */
      (key) => {
        const resolvedUrl = resolveURL(url);
        const pattern = new RegExp(requestPattern(key));

        return resolvedUrl.match(pattern);
      }
    );

  /** Handle Messages */
  window.addEventListener("message", (ev) => {
    try {
      if (ev.source === window && ev.data?.payload) {
        const { id, payload } = ev.data;
        const { action, data } = decryptData(payload);

        switch (action) {
          case "get-telegram-web-app":
            window.postMessage(
              {
                id,
                type: "response",
                payload: encryptData(window.Telegram?.WebApp),
              },
              "*"
            );
            break;
          case "get-request-data":
            Object.entries(data.items).forEach(([key, value]) => {
              /** Override XMLHttpRequest */
              window.XMLHttpRequest = modifiedXMLHttpRequest;

              /** Override fetch */
              window.fetch = modifiedFetch;

              /** Watch the requests */
              requestsToWatch.set(
                typeof value === "string" ? value : value.url,
                Object.assign(
                  { id, key },
                  typeof value === "object" ? value : null
                )
              );
            });
            break;
          case "open-telegram-link":
            window.Telegram?.WebApp?.openTelegramLink(data.url);
            window.postMessage(
              {
                id,
                type: "response",
                payload: encryptData(true),
              },
              "*"
            );
            break;

          case "close-bot":
            window.Telegram?.WebApp?.disableClosingConfirmation();
            window.Telegram?.WebApp?.close();
            window.postMessage(
              {
                id,
                type: "response",
                payload: encryptData(true),
              },
              "*"
            );
            break;
        }
      }
    } catch {}
  });

  /** Add Telegram Web Script */
  document.addEventListener("readystatechange", (ev) => {
    if (document.readyState === "interactive") {
      const tgWebScriptSrc = "https://telegram.org/js/telegram-web-app.js";
      let tgWebScript = Array.prototype.find.call(
        document.scripts,
        (script) => script.src === tgWebScriptSrc
      );

      /** Add Telegram Web */
      if (!tgWebScript) {
        tgWebScript = document.createElement("script");
        tgWebScript.src = tgWebScriptSrc;

        document.head.appendChild(tgWebScript);
      }
    }
  });
}
