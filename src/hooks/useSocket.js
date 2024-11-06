import { io } from "socket.io-client";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useEventEmitter from "./useEventEmitter";

export default function useSocket(server = "127.0.0.1:7777") {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const {
    emitter: commandHandlers,
    addListeners: addCommandHandlers,
    removeListeners: removeCommandHandlers,
  } = useEventEmitter();

  /** Dispatch */
  const dispatch = useCallback(
    (data) => {
      if (syncing && socketRef.current?.connected) {
        socketRef.current.send(data);
      }
    },
    [socketRef, syncing]
  );

  /** Instantiate Socket */
  useEffect(() => {
    const socket = (socketRef.current = io(`ws://${server}`));

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      try {
        socket.removeAllListeners();
        socket.close();
      } catch {}
      socketRef.current = null;
    };
  }, [server]);

  /** Handle Commands */
  useEffect(() => {
    const actionHandler = (arg) => {
      if (!syncing) return;

      commandHandlers.emit(arg.action, arg);
    };

    socketRef.current?.on("command", actionHandler);

    return () => {
      socketRef.current?.off("command", actionHandler);
    };
  }, [commandHandlers, syncing]);

  return useMemo(
    () => ({
      connected,
      syncing,
      dispatch,
      setSyncing,
      addCommandHandlers,
      removeCommandHandlers,
    }),
    [
      connected,
      syncing,
      dispatch,
      setSyncing,
      addCommandHandlers,
      removeCommandHandlers,
    ]
  );
}
