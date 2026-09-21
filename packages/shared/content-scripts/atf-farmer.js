if (location.host === "atfminers.asloni.online") {
  const INTERCEPT_SYNC_WALLET = true;
  const INTERCEPT_SUBSEQUENT_LOGIN = true;

  let initialLogin = false;

  const originalFetch = window.fetch.bind(window);
  const getBusyResponse = () => {
    return new Response(JSON.stringify({ status: "busy" }));
  };

  window.fetch = async (...args) => {
    if (typeof args[0] === "string") {
      let url = args[0];

      /* Check if the request is to sync the wallet */
      if (url.includes("sync_wallet")) {
        console.log("Received sync_wallet request", args);

        /* If the request is to sync the wallet, and the intercept is enabled, return a busy response */
        if (INTERCEPT_SYNC_WALLET) {
          console.log("Intercepting sync_wallet request");
          return getBusyResponse();
        }
      }

      /* Check if the request is to login */
      if (url.includes("login")) {
        console.log("Received login request", args);
        if (!initialLogin) {
          /* If this is the first login request, set the initialLogin flag to true */
          initialLogin = true;
        } else {
          if (INTERCEPT_SUBSEQUENT_LOGIN) {
            console.log("Intercepting login request");
            return getBusyResponse();
          }
        }
      }
    }

    const response = await originalFetch(...args);
    return response;
  };

  new MutationObserver((mutations, observer) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node.tagName === "SCRIPT" &&
          node.src &&
          node.src.endsWith("tonconnect-ui.min.js")
        ) {
          observer.disconnect();

          // Runs synchronously after tonconnect-ui.min.js loads,
          // before subsequent scripts execute.
          node.addEventListener("load", () => {
            const OriginalTonConnectUI = window.TON_CONNECT_UI.TonConnectUI;

            window.TON_CONNECT_UI.TonConnectUI = new Proxy(
              OriginalTonConnectUI,
              {
                construct(Target, args, newTarget) {
                  const instance = Reflect.construct(Target, args, newTarget);
                  return new Proxy(instance, {
                    get(target, prop, receiver) {
                      if (prop === "connected") return true;
                      return Reflect.get(target, prop, receiver);
                    },
                  });
                },
              },
            );
          });

          return;
        }
      }
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}
