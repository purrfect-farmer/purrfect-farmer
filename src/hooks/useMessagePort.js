import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";

import useEventEmitter from "./useEventEmitter";

export default function useMessagePort() {
  const ports = useMemo(() => new Set(), []);
  const {
    emitter: messageHandlers,
    addListeners: addMessageHandlers,
    removeListeners: removeMessageHandlers,
  } = useEventEmitter();

  /** Dispatch */
  const dispatch = useCallback(
    (message) => {
      ports.forEach((port) => {
        port.portMessage(message);
      });
    },
    [ports]
  );

  /** Add a Port */
  const addPort = useCallback(
    (port) => {
      /** Add Port */
      ports.add(port);

      /** Emit Event */
      messageHandlers.emit("port-connected", port);
    },
    [messageHandlers, ports]
  );

  /** Handle Port Message */
  const portMessageHandler = useCallback(
    (message, port) => {
      messageHandlers.emit(message.action, message, port);
    },
    [messageHandlers]
  );

  /** Remove a Port */
  const removePort = useCallback(
    (port) => {
      /** Remove Listeners */
      port.onMessage.removeListener(portMessageHandler);
      port.onDisconnect.removeListener(removePort);

      /** Remove Port */
      ports.delete(port);

      /** Emit Event */
      messageHandlers.emit("port-disconnected", port);
    },
    [messageHandlers, ports, portMessageHandler]
  );

  /** Instantiate Port Listener */
  useEffect(() => {
    /**
     * @param {chrome.runtime.Port} port
     */
    const portConnectHandler = (port) => {
      /** Add Port */
      addPort(port);

      /** Message Handler */
      if (port.name !== "telegram-web") {
        port.onMessage.addListener(portMessageHandler);
      }

      /** Register Disconnect */
      port.onDisconnect.addListener(removePort);
    };

    chrome?.runtime?.onConnect.addListener(portConnectHandler);

    return () => {
      chrome?.runtime?.onConnect.removeListener(portConnectHandler);
    };
  }, [portMessageHandler, addPort, removePort]);

  return useMemo(
    () => ({
      ports,
      dispatch,
      addMessageHandlers,
      removeMessageHandlers,
    }),
    [ports, dispatch, addMessageHandlers, removeMessageHandlers]
  );
}
