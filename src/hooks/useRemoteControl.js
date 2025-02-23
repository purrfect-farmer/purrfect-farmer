import { io } from "socket.io-client";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useEventEmitter from "./useEventEmitter";

export default function useRemoteControl(
  enabled = false,
  address = import.meta.env.VITE_REMOTE_CONTROL_SERVER
) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const {
    emitter: handler,
    addListeners: addCommandHandlers,
    removeListeners: removeCommandHandlers,
  } = useEventEmitter();

  /** Dispatch */
  const dispatch = useCallback(
    (data) => {
      if (enabled && syncing && socketRef.current?.connected) {
        socketRef.current?.send(data);
      }
    },
    [enabled, syncing]
  );

  /** Instantiate Socket */
  useLayoutEffect(() => {
    if (enabled && address) {
      const socket = (socketRef.current = io(`ws://${address}`));

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
    }
  }, [enabled, address]);

  /** Handle Commands */
  useLayoutEffect(() => {
    if (enabled && address) {
      const actionHandler = (arg) => {
        if (!syncing) return;

        handler.emit(arg.action, arg);
      };

      socketRef.current?.on("command", actionHandler);

      return () => {
        socketRef.current?.off("command", actionHandler);
      };
    }
  }, [enabled, address, handler, syncing]);

  return useMemo(
    () => ({
      connected,
      syncing,
      handler,
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
