import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";

import useEventEmitter from "./useEventEmitter";

export default function useMessagePort() {
  const ports = useMemo(() => new Set(), []);
  const {
    emitter: handler,
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
      handler.emit(`port-connected:${port.name}`, port);
    },
    [handler, ports]
  );

  /** Handle Port Message */
  const portMessageHandler = useCallback(
    (message, port) => {
      handler.emit(message.action, message, port);
    },
    [handler]
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
      handler.emit(`port-disconnected:${port.name}`, port);
    },
    [handler, ports, portMessageHandler]
  );

  /** Instantiate Port Listener */
  useLayoutEffect(() => {
    /**
     * @param {chrome.runtime.Port} port
     */
    const portConnectHandler = (port) => {
      /** Add Port */
      addPort(port);

      /** Register Disconnect */
      port.onDisconnect.addListener(removePort);

      /** Message Handler */
      port.onMessage.addListener(portMessageHandler);
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
      handler,
      addMessageHandlers,
      removeMessageHandlers,
    }),
    [ports, dispatch, addMessageHandlers, removeMessageHandlers]
  );
}
