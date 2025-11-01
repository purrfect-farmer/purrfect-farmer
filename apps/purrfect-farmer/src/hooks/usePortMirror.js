import { useCallback } from "react";
import { useLayoutEffect } from "react";

import useEventEmitter from "./useEventEmitter";
import useValuesMemo from "./useValuesMemo";

/**
 * @param {chrome.runtime.Port} port
 */
export default function usePortMirror(port) {
  const mirroring = Boolean(port);
  const {
    emitter: handler,
    addListeners: addCommandHandlers,
    removeListeners: removeCommandHandlers,
  } = useEventEmitter();

  /** Dispatch */
  const dispatch = useCallback(
    (message) => {
      port?.postMessage(message);
    },
    [port]
  );

  /** Handle Commands */
  useLayoutEffect(() => {
    const actionHandler = (message) => {
      handler.emit(message.action, message);
    };

    port?.onMessage.addListener(actionHandler);

    return () => {
      port?.onMessage.removeListener(actionHandler);
    };
  }, [port, handler]);

  return useValuesMemo({
    port,
    mirroring,
    handler,
    dispatch,
    addCommandHandlers,
    removeCommandHandlers,
  });
}
