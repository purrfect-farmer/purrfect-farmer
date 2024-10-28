import useEventEmitter from "@/hooks/useEventEmitter";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

export default function useBirdTon(farmer) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef();
  const user = farmer.authQuery.data;

  const {
    emitter: messageHandlers,
    addListeners: addMessageHandlers,
    removeListeners: removeMessageHandlers,
  } = useEventEmitter();

  /** Event Data */
  const [eventData, setEventData] = useState(() => new Map());

  /** Send Message */
  const sendMessage = useCallback(
    (message) => {
      socketRef.current?.send(JSON.stringify(message));
    },
    [socketRef]
  );

  /** Send Auth */
  const sendAuth = useCallback(() => {
    sendMessage({
      event_type: "auth",
      data: JSON.stringify(farmer.telegramWebApp),
    });
  }, [sendMessage, farmer.telegramWebApp]);

  /** Ping */
  const ping = useCallback(() => {
    if (socketRef.current?.OPEN) {
      socketRef.current?.send("ping");
    }
  }, [socketRef]);

  /** Handle Messages */
  useEffect(() => {
    /** Ping Timeout */
    let pingTimeout;

    /** Message Controller */
    const messageController = (message) => {
      if (message.data === "pong") {
        pingTimeout = setTimeout(ping, 5000);
        return;
      }

      /** Message */
      const data = JSON.parse(message.data);

      if (messageHandlers.listeners(data["event_type"]).length) {
        messageHandlers.emit(data["event_type"], data);
      } else {
        setEventData((prev) => {
          const newMap = new Map(prev);

          newMap.set(data["event_type"], JSON.parse(data["data"]));

          return newMap;
        });
      }
    };

    /** Add Message Listener */
    socketRef.current?.addEventListener("message", messageController);

    /** Set Ping Timeout */
    pingTimeout = setTimeout(ping, 5000);

    return () => {
      /** Clear Ping Timeout */
      clearTimeout(pingTimeout);

      /** Remove Message Listener */
      socketRef.current?.removeEventListener("message", messageController);
    };
  }, [connected, messageHandlers, ping, setEventData]);

  /** Instantiate the Socket */
  useEffect(() => {
    if (!user?.["auth_key"]) return;

    /** Create Socker */
    const socket = (socketRef.current = new WebSocket(
      `wss://birdton.site/ws?auth=${encodeURIComponent(user?.["auth_key"])}`
    ));

    /** Add Event Listener for Open */
    socket.addEventListener("open", () => {
      /** Set Connected True */
      setConnected(true);

      /** Send Auth */
      sendAuth();
    });

    /** Add Event Listener for Close */
    socket.addEventListener("close", () => {
      /** Set Connected False */
      setConnected(false);

      /** Reset Telegram Web */
      farmer.resetTelegramWebApp();
    });

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.["auth_key"], farmer.resetTelegramWebApp]);

  return useMemo(
    () => ({
      ...farmer,
      user,
      eventData,
      connected,
      sendAuth,
      sendMessage,
      addMessageHandlers,
      removeMessageHandlers,
    }),
    [
      farmer,
      user,
      eventData,
      connected,
      sendAuth,
      sendMessage,
      addMessageHandlers,
      removeMessageHandlers,
    ]
  );
}
