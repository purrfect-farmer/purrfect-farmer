import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";

import useMapState from "./useMapState";

export default function useMessagePort() {
  const ports = useMemo(() => new Set(), []);
  const {
    map: messageHandlers,
    addMapItems: addMessageHandlers,
    removeMapItems: removeMessageHandlers,
  } = useMapState();

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
      ports.add(port);
    },
    [ports]
  );

  /** Remove a Port */
  const removePort = useCallback(
    (port) => {
      /** Remove Listener */
      port.onDisconnect.removeListener(removePort);

      /** Remove Port */
      ports.delete(port);
    },
    [ports]
  );

  /** Handle Port Message */
  const portMessageHandler = useCallback(
    (message, port) => {
      const callback = messageHandlers.get(message.action);

      if (callback) {
        callback(message, port);
      }
    },
    [messageHandlers]
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

  /** Handle Messages */
  useEffect(() => {
    const messageHandler = (message, port) => {
      const callback = messageHandlers.get(message.action);

      if (callback) {
        callback(message, port);
      }
    };

    ports.forEach((port) => {
      port.onMessage.addListener(messageHandler);
    });

    return () => {
      ports.forEach((port) => {
        port.onMessage.removeListener(messageHandler);
      });
    };
  }, [messageHandlers, ports]);

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
