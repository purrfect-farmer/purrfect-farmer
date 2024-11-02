import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useSocketDispatchCallback from "./useSocketDispatchCallback";
import useSocketHandlers from "./useSocketHandlers";

export default function useProcessLock(id) {
  const controllerRef = useRef();
  const [process, setProcess] = useState({
    started: false,
    locked: false,
    controller: null,
    signal: null,
  });

  const canExecute = useMemo(
    () => process.started && !process.locked,
    [process]
  );

  /** Start Process */
  const [start, dispatchAndStart] = useSocketDispatchCallback(
    /** Main */
    useCallback(() => {
      setProcess((prev) => {
        if (prev.started) return prev;

        prev?.controller?.abort();
        const controller = (controllerRef.current = new AbortController());
        return {
          started: true,
          locked: false,
          controller,
          signal: controller.signal,
        };
      });
    }, [setProcess]),

    /** Dispatch */
    useCallback(
      (socket) => {
        socket.dispatch({
          action: `${id}:start`,
        });
      },
      [id]
    )
  );

  /** Stop Process */
  const [stop, dispatchAndStop] = useSocketDispatchCallback(
    /** Main */
    useCallback(() => {
      setProcess((prev) => {
        if (!prev.started) return prev;

        prev?.controller?.abort();
        controllerRef.current = null;

        return {
          started: false,
          locked: false,
          controller: null,
          signal: null,
        };
      });
    }, [setProcess]),

    /** Dispatch */
    useCallback(
      (socket) => {
        socket.dispatch({
          action: `${id}:stop`,
        });
      },
      [id]
    )
  );

  /** Toggle */
  const [toggle, dispatchAndToggle] = useSocketDispatchCallback(
    /** Main */
    useCallback(
      (status) => {
        if (typeof status === "boolean") {
          return status ? start() : stop();
        } else if (!process.started) {
          start();
        } else {
          stop();
        }
      },
      [process.started, start, stop]
    ),

    /** Dispatch */
    useCallback(
      (socket, status) => {
        socket.dispatch({
          action: `${id}:toggle`,
          data: {
            status,
          },
        });
      },
      [id]
    )
  );

  /** Lock Process */
  const lock = useCallback(() => {
    setProcess((prev) => ({
      ...prev,
      locked: true,
    }));
  }, [setProcess]);

  /** Unlock Process */
  const unlock = useCallback(() => {
    setProcess((prev) => ({
      ...prev,
      locked: false,
    }));
  }, [setProcess]);

  /** Terminate on Unmount */
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        [`${id}:start`]: () => {
          start();
        },
        [`${id}:stop`]: () => {
          stop();
        },
        [`${id}:toggle`]: (command) => {
          toggle(command.data.status);
        },
      }),
      [id, start, stop, toggle]
    )
  );

  return useMemo(
    () => ({
      ...process,
      canExecute,
      start,
      stop,
      toggle,
      lock,
      unlock,
      dispatchAndStart,
      dispatchAndStop,
      dispatchAndToggle,
    }),
    [
      process,
      canExecute,
      start,
      stop,
      toggle,
      lock,
      unlock,
      dispatchAndStart,
      dispatchAndStop,
    ]
  );
}
