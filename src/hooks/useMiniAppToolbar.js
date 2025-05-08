import BrowserIcon from "@/assets/images/browser.png?w=80&format=webp";
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
          if (message.action.startsWith("mirror:")) {
            mirror.dispatch({
              action: "mini-app-toolbar:handle-message",
              data: {
                name: port.name,
                message,
              },
            });
          }
        });
      }
    },
    [mirror]
  );

  /** Handle Toolbar Message */
  const handleToolbarMessage = useCallback(
    (message) => {
      messaging.ports
        .values()
        .filter((port) => port.name === message.data.name)
        .forEach((port) => {
          port.postMessage(message.data.message);
        });
    },
    [messaging.ports]
  );

  /** Launch in Farmer */
  const launchInAppBrowser = useCallback(
    (message) => {
      const { id, url, icon, title } = message.data;

      core.launchInAppBrowser({
        id,
        url,
        title,
        icon: icon || BrowserIcon,
      });
    },
    [core.launchInAppBrowser]
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
        ["launch-in-app-browser"]: launchInAppBrowser,
      }),
      [dispatchToolbarMessage, launchInAppBrowser]
    ),
    messaging
  );
}
