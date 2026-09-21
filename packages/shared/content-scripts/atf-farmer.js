if (location.host === "atfminers.asloni.online") {
  const INTERCEPT_SYNC_WALLET = false;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    if (typeof args[0] === "string" && args[0].includes("sync_wallet")) {
      console.log("Received sync_wallet request", args);
      if (INTERCEPT_SYNC_WALLET) {
        console.log("Intercepting sync_wallet request");
        return new Response(JSON.stringify({ status: "busy" }));
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
