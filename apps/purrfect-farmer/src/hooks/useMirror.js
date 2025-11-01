import { customLogger } from "@/lib/utils";
import { io } from "socket.io-client";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useEventEmitter from "./useEventEmitter";

export default function useMirror(
  enabled = false,
  address = import.meta.env.VITE_MIRROR_SERVER
) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [mirroring, setMirroring] = useState(true);
  const {
    emitter: handler,
    addListeners: addCommandHandlers,
    removeListeners: removeCommandHandlers,
  } = useEventEmitter();

  /** Dispatch */
  const dispatch = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current?.send(data);
    }
  }, []);

  /** Instantiate Socket */
  useLayoutEffect(() => {
    if (enabled && address) {
      /** Create Socket */
      const socket = io(`ws://${address}`);

      /** Store Ref */
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
      });

      socket.on("disconnect", () => {
        setConnected(false);
      });

      return () => {
        try {
          socket.close();
        } catch (e) {
          customLogger("REMOTE CONTROL SOCKET ERROR", e);
        }
        socketRef.current = null;
      };
    }
  }, [enabled, address]);

  /** Handle Commands */
  useLayoutEffect(() => {
    if (enabled && address) {
      const actionHandler = (arg) => {
        handler.emit(arg.action, arg);
      };

      socketRef.current?.on("command", actionHandler);

      return () => {
        socketRef.current?.off("command", actionHandler);
      };
    }
  }, [enabled, address, handler]);

  return useMemo(
    () => ({
      connected,
      mirroring,
      handler,
      dispatch,
      setMirroring,
      addCommandHandlers,
      removeCommandHandlers,
    }),
    [
      connected,
      mirroring,
      dispatch,
      setMirroring,
      addCommandHandlers,
      removeCommandHandlers,
    ]
  );
}
