import { useCallback } from "react";
import { useMemo } from "react";

import useMessageHandlers from "./useMessageHandlers";
import useMirroredHandlers from "./useMirroredHandlers";

export default function useMiniAppToolbar(core) {
  const { mirror, messaging } = core;

  const dispatchToolbarMessage = useCallback(
    (port) => {
      if (port.name.startsWith("mini-app-toolbar:")) {
        port.onMessage.addListener((message) => {
          mirror.dispatch({
            action: "mini-app-toolbar:handle-message",
            data: {
              name: port.name,
              message,
            },
          });
        });
      }
    },
    [mirror]
  );

  const handleToolbarMessage = useCallback(
    (message) => {
      const port = messaging.ports
        .values()
        .find((port) => port.name === message.data.name);

      if (port) {
        port.postMessage(message.data.message);
      }
    },
    [messaging.ports]
  );

  /** Handle Message */
  useMirroredHandlers(
    useMemo(
      () => ({
        ["mini-app-toolbar:handle-message"]: handleToolbarMessage,
      }),
      [handleToolbarMessage]
    ),
    mirror
  );

  /** Handle Port Message */
  useMessageHandlers(
    useMemo(
      () => ({
        ["port-connected"]: dispatchToolbarMessage,
      }),
      [dispatchToolbarMessage]
    ),
    messaging
  );
}
