import { core, decryptData, encryptData } from "./content-script-utils";

if (import.meta.env.VITE_BRIDGE) {
  /**
   * @param {MessageEvent} ev
   */
  const handleBridge = (ev) => {
    if (ev.source === window && ev.data?.bridgeId) {
      /** Remove Listener */
      window.removeEventListener("message", handleBridge);

      /** Expose */
      if (ev.data.expose) {
        window.BRIDGE_ID = ev.data?.bridgeId;
      }
    }
  };

  /** Listen for Bridge */
  window.addEventListener("message", handleBridge);
}

if (location.hash.includes("tgWebAppData")) {
  const webPlatFormRegExp = /tgWebAppPlatform=(webk|weba|web)/;

  /** Replace Platform */
  if (webPlatFormRegExp.test(location.href)) {
    /** Warn */
    core.console.warn("Reloading...");

    /** Replace Platform */
    const url = new URL(
      location.href.replace(webPlatFormRegExp, "tgWebAppPlatform=android")
    );

    /** Add Search Param */
    url.searchParams.set("tgWebAppInitDate", Date.now());

    /** Force Reload */
    location.href = url.href;
  } else {
    /** Initial Location Hash */
    const INITIAL_LOCATION = location.href;

    /** Telegram Web Script */
    const TG_WEB_SCRIPT_SRC = "https://telegram.org/js/telegram-web-app.js";

    /** Requests to Watch */
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

    /** Override User Agent */
    const overrideUserAgent = (userAgent) => {
      /** Override User Agent */
      Object.defineProperty(navigator, "userAgent", {
        get: () => userAgent,
        configurable: true,
      });
    };

    /** Override Parent */
    window.parent = new Proxy(window.parent, {
      get(target, p) {
        if (p === "postMessage") {
          return (...args) => {
            const inputs = [...args];

            if (inputs.length > 1) {
              if (typeof inputs[1] === "object") {
                inputs[1].targetOrigin = "*";
              } else {
                inputs[1] = "*";
              }
            }
            target.postMessage(...inputs);
          };
        } else if (typeof target[p] === "function") {
          return target[p].bind(target);
        }

        return target[p];
      },
    });

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

    /** Modify Race */
    Promise.race = function (...args) {
      return core.Promise.race(...args).catch((err) => {
        if (err.type === "ERR_TIMED_OUT") {
          return Promise.resolve({});
        } else {
          return Promise.reject(err);
        }
      });
    };

    /** Handle Messages */
    window.addEventListener("message", (ev) => {
      try {
        if (ev.source === window && ev.data?.payload) {
          const { id, payload } = ev.data;
          const { action, data } = decryptData(payload);

          switch (action) {
            case "set-user-agent":
              overrideUserAgent(data.userAgent);
              window.postMessage(
                {
                  id,
                  type: "response",
                  payload: encryptData(true),
                },
                "*"
              );
              break;

            case "get-telegram-web-app":
              window.postMessage(
                {
                  id,
                  type: "response",
                  payload: encryptData(getTelegramWebApp()),
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
              window.Telegram?.WebApp?.disableClosingConfirmation();
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
      } catch (e) {
        console.error(e);
      }
    });

    /** Get TelegramWebApp */
    const getTelegramWebApp = () => {
      if (window.Telegram?.WebApp) {
        const { initData, initDataUnsafe, platform, version } =
          window.Telegram?.WebApp;

        return {
          initData,
          initDataUnsafe,
          platform,
          version,
        };
      }
    };

    /** Dispatch TelegramWebApp */
    const dispatchTelegramWebApp = async () => {
      window.postMessage(
        {
          type: "init",
          payload: encryptData(getTelegramWebApp()),
        },
        "*"
      );
    };

    /** Observe Scripts */
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.tagName === "HEAD") {
              let script;

              /** Get Telegram Script */
              for (const item of node.querySelectorAll("script")) {
                if (item.src === TG_WEB_SCRIPT_SRC) {
                  script = item;
                  break;
                }
              }

              /** Add Telegram Web */
              if (!script) {
                /** Create Script */
                script = document.createElement("script");
                script.src = TG_WEB_SCRIPT_SRC;

                /** Insert Immediately */
                node.prepend(script);
              }

              /** Override Type */
              script.type = "text/javascript";

              /** Add Load Listener */
              script.addEventListener("load", async (ev) => {
                /** Dispatch App */
                dispatchTelegramWebApp();
              });
            } else if (node.tagName === "BODY") {
              /** Disconnect */
              observer.disconnect();
            }
          });
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
}
