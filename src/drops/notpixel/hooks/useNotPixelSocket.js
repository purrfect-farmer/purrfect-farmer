import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";
import useNotPixelUserQuery from "./useNotPixelUserQuery";

export default function useNotPixelSocket(
  enabled,
  sandboxRef,
  updateWorldPixels
) {
  const { data: user } = useNotPixelUserQuery({
    enabled,
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
        case "set-socket-status":
          setConnected(message.data);
          break;

        case "update-world-pixels":
          updateWorldPixels(message.data);
          break;
      }
    };

    if (enabled && websocketToken) {
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
  }, [enabled, websocketToken, updateWorldPixels, setConnected]);

  return useMemo(() => ({ connected }), [connected]);
}
