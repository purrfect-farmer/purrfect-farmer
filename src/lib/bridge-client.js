import { isExtension, uuid } from "./utils";

if (
  isExtension() === false &&
  typeof chrome?.runtime?.connect !== "undefined"
) {
  /** Port */
  const port = chrome.runtime.connect(import.meta.env.VITE_BRIDGE_EXTENSION_ID);

  /** Callable Bridge Map */
  const callableMap = new Map();

  /** Create Bridged Function */
  const createFunction = (callable) => {
    const id = "__FUNCTION__" + uuid();
    callableMap.set(id, callable);
    return id;
  };

  /** Remove Bridged Function */
  const removeFunction = (callable) => {
    const id = callableMap.entries().find(([, v]) => v === callable)[0];
    callableMap.delete(id);
    return id;
  };

  /** Check if is Chrome Port */
  const isChromePort = (obj) => {
    return obj && typeof obj === "object" && typeof obj.__PORT__ === "string";
  };

  /** Proxy Chrome Port */
  const portProxy = (port, entries) =>
    new Proxy(() => entries, {
      get(target, prop) {
        return portProxy(port, [...entries, prop]);
      },

      apply(target, thisArg, args) {
        return sendMessage({
          port,
          action: "execute",
          method: entries,
          args: args.map((item) =>
            typeof item === "function"
              ? entries.at(-1) === "addListener"
                ? createFunction(item)
                : removeFunction(item)
              : item
          ),
        });
      },
    });

  /** Bridge a Port */
  const bridgePort = (port) =>
    new Proxy(port, {
      get(target, prop) {
        if (typeof target[prop] !== "undefined") {
          return target[prop];
        } else {
          return portProxy(port.__PORT__, [prop]);
        }
      },
    });

  /** Send Message */
  const sendMessage = (message) =>
    new Promise((resolve) => {
      const id = uuid();
      const handler = (message) => {
        if (message.id === id) {
          port.onMessage.removeListener(handler);
          resolve(message.result);
        }
      };

      /** Add Listener */
      port.onMessage.addListener(handler);

      /** Post Message */
      port.postMessage({
        ...message,
        id,
      });
    });

  /** Chrome Proxy */
  const chromeProxy = (entries) =>
    new Proxy(() => entries, {
      get(target, prop) {
        return chromeProxy([...entries, prop]);
      },

      apply(target, thisArg, args) {
        return sendMessage({
          action: "execute",
          method: entries,
          args: args.map((item) =>
            typeof item === "function"
              ? entries.at(-1) === "addListener"
                ? createFunction(item)
                : removeFunction(item)
              : item
          ),
        });
      },
    });

  /** Proxy Chrome Namespace */
  window.chrome = new Proxy(window.chrome, {
    get(target, prop) {
      return chromeProxy([prop]);
    },
  });

  /** Bridged Fetch */
  window.bridgedFetch = (args) => {
    return sendMessage({
      action: "fetch",
      args,
    });
  };

  /** Listen for Message */
  port.onMessage.addListener((message) => {
    if (message.action === "execute") {
      const callable = callableMap.get(message.method);

      if (callable) {
        callable(
          ...message.args.map((item) =>
            isChromePort(item) ? bridgePort(item) : item
          )
        );
      } else {
        console.error(message);
      }
    }
  });

  /** Ping Port */
  setInterval(() => {
    try {
      sendMessage({ type: "ping" });
    } catch (e) {
      console.warn("Port is disconnected:", e);
    }
  }, 5000);
}
