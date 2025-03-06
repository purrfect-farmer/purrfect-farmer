import { customLogger } from "@/lib/utils";
import { io } from "socket.io-client";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useEventEmitter from "./useEventEmitter";
import useSyncedRef from "./useSyncedRef";

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

  /** Store Mirroring State in Ref */
  const mirroringRef = useSyncedRef(mirroring);

  /** Dispatch */
  const dispatch = useCallback((data) => {
    if (mirroringRef.current && socketRef.current?.connected) {
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
        if (mirroring) {
          handler.emit(arg.action, arg);
        }
      };

      socketRef.current?.on("command", actionHandler);

      return () => {
        socketRef.current?.off("command", actionHandler);
      };
    }
  }, [enabled, address, handler, mirroring]);

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
