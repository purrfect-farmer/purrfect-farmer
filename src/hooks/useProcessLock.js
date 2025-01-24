import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useSocketDispatchCallback from "./useSocketDispatchCallback";

export default function useProcessLock(key, socket) {
  const controllerRef = useRef();
  const [process, setProcess] = useState({
    started: false,
    locked: false,
    controller: null,
  });

  const canExecute = useMemo(
    () => process.started && !process.locked,
    [process]
  );

  /** Start Process */
  const [start, dispatchAndStart] = useSocketDispatchCallback(
    key + ":start",
    (callback) => {
      setProcess((prev) => {
        if (prev.started) {
          if (typeof callback === "function") {
            callback(prev);
          }
          return prev;
        }

        prev?.controller?.abort();
        const controller = (controllerRef.current = new AbortController());

        const newState = {
          started: true,
          locked: false,
          controller,
        };

        if (typeof callback === "function") {
          callback(newState);
        }

        return newState;
      });
    },
    [setProcess],

    /** Socket */
    socket
  );

  /** Stop Process */
  const [stop, dispatchAndStop] = useSocketDispatchCallback(
    key + ":stop",
    (callback) => {
      setProcess((prev) => {
        if (!prev.started) {
          if (typeof callback === "function") {
            callback(prev);
          }
          return prev;
        }

        prev?.controller?.abort();
        controllerRef.current = null;

        const newState = {
          started: false,
          locked: false,
          controller: null,
        };

        if (typeof callback === "function") {
          callback(newState);
        }

        return newState;
      });
    },
    [setProcess],

    /** Socket */
    socket
  );

  /** Toggle */
  const [toggle, dispatchAndToggle] = useSocketDispatchCallback(
    key + ":toggle",
    (status) => {
      if (typeof status === "boolean") {
        return status ? start() : stop();
      } else if (!process.started) {
        return start();
      } else {
        return stop();
      }
    },
    [process.started, start, stop],

    /** Socket */
    socket
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

  /** Exectute A Callback */
  const execute = useCallback(
    async (callback) => {
      /** Lock */
      await lock();

      /** Should Stop? */
      if (await callback()) {
        await stop();
      } else {
        await unlock();
      }
    },
    [lock, unlock, stop]
  );

  /** Terminate on Unmount */
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return useMemo(
    () => ({
      ...process,
      canExecute,
      start,
      stop,
      toggle,
      lock,
      unlock,
      execute,
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
