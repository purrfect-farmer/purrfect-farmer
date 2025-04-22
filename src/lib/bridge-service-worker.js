import { uuid } from "@/lib/utils";

const callableMap = new Map();
const portsMap = new Map();

/**
 * @param {chrome.runtime.Port} port
 */
const bridgePort = (port) => {
  const id = "__PORT__" + uuid();
  portsMap.set(id, port);

  port.onDisconnect.addListener(() => {
    portsMap.delete(id);
  });

  return {
    name: port.name,
    sender: port.sender,
    __PORT__: id,
  };
};

const isChromePort = (obj) => {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.postMessage === "function" &&
    typeof obj.disconnect === "function" &&
    typeof obj.name === "string" &&
    typeof obj.onDisconnect === "object" &&
    typeof obj.onMessage === "object"
  );
};

const createFunction = (id, port) => {
  const handler = (...args) => {
    port.postMessage({
      action: "execute",
      method: id,
      args: args.map((item) => (isChromePort(item) ? bridgePort(item) : item)),
    });
  };

  callableMap.set(id, handler);

  return handler;
};

const removeFunction = (id) => {
  const callable = callableMap.get(id);
  callableMap.delete(id);
  return callable;
};

chrome.runtime.onConnectExternal.addListener((port) => {
  port.onMessage.addListener(async (message) => {
    const target = message.method.reduce(
      (current, item) =>
        typeof current[item] === "function"
          ? current[item].bind(current)
          : current[item],
      message.port ? portsMap.get(message.port) : chrome
    );

    const result = await target(
      ...message.args.map((item) =>
        typeof item === "string" && item.startsWith("__FUNCTION__")
          ? message.method.at(-1) === "addListener"
            ? createFunction(item, port)
            : removeFunction(item)
          : item
      )
    );

    port.postMessage({
      id: message.id,
      result,
    });
  });

  port.onDisconnect.addListener(() => {
    portsMap.forEach(
      /**
       * @param {chrome.runtime.Port} port
       */
      (port) => {
        port.disconnect();
      }
    );

    /** Clear  */
    callableMap.clear();
    portsMap.clear();
  });
});
