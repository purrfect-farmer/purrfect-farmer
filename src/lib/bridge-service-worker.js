import axios from "axios";
import { uuid } from "@/lib/utils";

if (typeof import.meta.env.VITE_BRIDGE !== "undefined") {
  chrome.runtime.onConnectExternal.addListener((port) => {
    /** Create Maps */
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

    /** Check if is port */
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

    /** Create Function */
    const createFunction = (id, port) => {
      const handler = (...args) => {
        port.postMessage({
          action: "execute",
          method: id,
          args: args.map((item) =>
            isChromePort(item) ? bridgePort(item) : item
          ),
        });
      };

      callableMap.set(id, handler);

      return handler;
    };

    /** Remove Function */
    const removeFunction = (id) => {
      const callable = callableMap.get(id);
      callableMap.delete(id);
      return callable;
    };

    /** Listen for Message */
    port.onMessage.addListener(async (message) => {
      if (message.action === "execute") {
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

        /** Post Result */
        port.postMessage({
          id: message.id,
          result,
        });
      } else if (message.action === "fetch") {
        try {
          const { data, transformData, ...options } = message.args;

          /** Get Response */
          const response = await axios.request({
            ...options,
            data:
              transformData === "URLSearchParams"
                ? new URLSearchParams(data)
                : data,
          });

          /** Post Response */
          port.postMessage({
            id: message.id,
            result: {
              status: true,
              response: {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data,
              },
            },
          });
        } catch (error) {
          /** Log Error */
          console.error(error);

          /** Post Error */
          port.postMessage({
            id: message.id,
            result: {
              status: false,
              error: {
                status: error.status,
                code: error.code,
                message: error.message,
                response: error.response
                  ? {
                      status: error.response.status,
                      statusText: error.response.statusText,
                      headers: error.response.headers,
                      data: error.response.data,
                    }
                  : undefined,
              },
            },
          });
        }
      } else {
        /** Post Pong */
        port.postMessage({
          id: message.id,
          result: {
            type: "pong",
          },
        });
      }
    });

    /** Cleanup on Disconnect */
    port.onDisconnect.addListener(() => {
      /** Disconnect Ports */
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
}
