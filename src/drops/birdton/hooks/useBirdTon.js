import useEventEmitter from "@/hooks/useEventEmitter";
import useValuesMemo from "@/hooks/useValuesMemo";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

export default function useBirdTon(farmer) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef();
  const user = farmer.authQuery.data;

  const [websocketAuthKey, setWebsocketAuthKey] = useState(null);

  const {
    emitter: handler,
    addListeners: addMessageHandlers,
    removeListeners: removeMessageHandlers,
  } = useEventEmitter();

  /** Event Data */
  const [eventData, setEventData] = useState(() => new Map());

  /** Send Message */
  const sendMessage = useCallback(
    (message) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current?.send(JSON.stringify(message));
      }
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

  const refreshTasks = useCallback(() => {
    sendMessage({
      event_type: "refresh_tasks",
      data: "",
    });
  }, [sendMessage]);

  /** Set Auth Key */
  useEffect(() => {
    if (user) {
      setWebsocketAuthKey(user?.["auth_key"]);
    }
  }, [user, setWebsocketAuthKey]);

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

      if (handler.listeners(data["event_type"]).length) {
        handler.emit(data["event_type"], data);
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
  }, [connected, handler, ping, setEventData]);

  /** Instantiate the Socket */
  useEffect(() => {
    if (!websocketAuthKey) return;

    /** Create Socker */
    const socket = (socketRef.current = new WebSocket(
      `wss://birdton.site/ws?auth=${encodeURIComponent(websocketAuthKey)}`
    ));

    /** Add Event Listener for Open */
    socket.addEventListener("open", () => {
      /** Set Connected True */
      setConnected(true);

      /** Send Auth */
      sendAuth();
    });

    /** Add Event Listener for Close */
    socket.addEventListener("close", (ev) => {
      /** Reset Farmer */
      if (ev.code !== 3000) {
        farmer.reset();
      }
    });

    return () => {
      try {
        socketRef.current?.close(3000);
      } catch (e) {
        console.error(e);
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, [websocketAuthKey, farmer.reset]);

  /** Mark as Started */
  useEffect(() => {
    farmer.markAsStarted(connected);
  }, [connected, farmer.markAsStarted]);

  return useValuesMemo({
    ...farmer,
    user,
    eventData,
    connected,
    setEventData,
    sendAuth,
    sendMessage,
    addMessageHandlers,
    removeMessageHandlers,
    refreshTasks,
  });
}
