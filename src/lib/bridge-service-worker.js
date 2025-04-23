import axios from "axios";
import { uuid } from "@/lib/utils";

if (typeof import.meta.env.VITE_BRIDGE !== "undefined") {
  chrome.runtime.onConnectExternal.addListener((port) => {
    /** Create Maps */
    const callables = new Map();
    const ports = new Map();

    /**
     * @param {chrome.runtime.Port} port
     */
    const bridgePort = (port) => {
      const id = "__PORT__" + uuid();
      ports.set(id, port);

      port.onDisconnect.addListener(() => {
        ports.delete(id);
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
    const createFunction = (id, method, target) => {
      const handler = (...args) => {
        port.postMessage({
          action: "execute",
          method: id,
          args: args.map((item) =>
            isChromePort(item) ? bridgePort(item) : item
          ),
        });
      };

      callables.set(id, { target, method, handler });

      return handler;
    };

    /** Remove Function */
    const removeFunction = (id) => {
      const callable = callables.get(id);
      callables.delete(id);
      return callable.handler;
    };

    /** Resolve Target */
    const resolveTarget = (method, target) =>
      method.reduce(
        (current, item) =>
          typeof current[item] === "function"
            ? current[item].bind(current)
            : current[item],
        target
      );

    /** Listen for Message */
    port.onMessage.addListener(async (message) => {
      if (message.action === "execute") {
        const target = resolveTarget(
          message.method,
          message.port ? ports.get(message.port) : chrome
        );

        const result = await target(
          ...message.args.map((item) =>
            typeof item === "string" && item.startsWith("__FUNCTION__")
              ? message.method.at(-1) === "addListener"
                ? createFunction(
                    item,
                    message.method,
                    message.port ? ports.get(message.port) : chrome
                  )
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
      ports.forEach(
        /**
         * @param {chrome.runtime.Port} port
         */
        (port) => {
          port.disconnect();
        }
      );

      /** Unregister Callbacks */
      callables.forEach((item) => {
        const method = [...item.method.slice(0, -1), "removeListener"];
        const target = resolveTarget(method, item.target);

        target(item.handler);
      });

      /** Clear  */
      callables.clear();
      ports.clear();
    });
  });
}
