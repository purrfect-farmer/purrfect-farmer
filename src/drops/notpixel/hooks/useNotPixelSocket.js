import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useNotPixelUserQuery from "./useNotPixelUserQuery";

export default function useNotPixelSocket({
  initiated,
  sandboxRef,
  updateWorldPixels,
  connectedCallbackRef,
}) {
  const { data: user } = useNotPixelUserQuery({
    enabled: initiated,
  });

  const [connected, setConnected] = useState(false);
  const [websocketToken, setWebsocketToken] = useState(null);

  useEffect(() => {
    if (user && !websocketToken) {
      setWebsocketToken(user.websocketToken);
    }
  }, [websocketToken, user]);

  useEffect(() => {
    const handleMessage = (ev) => {
      const message = ev.data;

      switch (message.action) {
        case "set-world-data":
          if (connectedCallbackRef.current) {
            connectedCallbackRef.current(message.data);
          }
          break;

        case "set-socket-status":
          setConnected(message.data);
          break;

        case "update-world-pixels":
          updateWorldPixels(message.data);
          break;
      }
    };

    if (initiated && websocketToken) {
      const sandbox = sandboxRef.current;

      window.addEventListener("message", handleMessage);

      sandbox.contentWindow.postMessage(
        {
          action: "start-socket",
          data: { token: websocketToken },
        },
        "*"
      );
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [initiated, websocketToken, updateWorldPixels, setConnected]);

  return useMemo(() => ({ connected }), [connected]);
}
