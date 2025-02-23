import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useState } from "react";

import useRemoteCallback from "./useRemoteCallback";

export default function useProcessLock(key, remote) {
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
  const [start, dispatchAndStart] = useRemoteCallback(
    key + ":start",
    (callback) => {
      setProcess((prev) => {
        if (prev.started) {
          callback?.(prev);
          return prev;
        }

        prev?.controller?.abort();
        const controller = (controllerRef.current = new AbortController());

        const newState = {
          started: true,
          locked: false,
          controller,
        };

        callback?.(newState);

        return newState;
      });
    },
    [setProcess],

    /** Remote */
    remote
  );

  /** Stop Process */
  const [stop, dispatchAndStop] = useRemoteCallback(
    key + ":stop",
    (callback) => {
      setProcess((prev) => {
        if (!prev.started) {
          callback?.(prev);
          return prev;
        }

        prev?.controller?.abort();
        controllerRef.current = null;

        const newState = {
          started: false,
          locked: false,
          controller: null,
        };

        callback?.(newState);

        return newState;
      });
    },
    [setProcess],

    /** Remote */
    remote
  );

  /** Toggle */
  const [toggle, dispatchAndToggle] = useRemoteCallback(
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

    /** Remote */
    remote
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
