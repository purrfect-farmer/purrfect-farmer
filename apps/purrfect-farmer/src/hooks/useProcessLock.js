import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import useMirroredCallback from "./useMirroredCallback";
import useValuesMemo from "./useValuesMemo";

export default function useProcessLock(key, mirror) {
  const controller = useRef();
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);

  const canExecute = started && !locked;

  /** Start Process */
  const [start, dispatchAndStart] = useMirroredCallback(
    key + ":start",
    () => {
      if (started) {
        return;
      }

      controller.current?.abort();
      controller.current = new AbortController();

      setStarted(true);
      setLocked(false);
    },
    [started, setStarted, setLocked],

    /** Mirror */
    mirror
  );

  /** Stop Process */
  const [stop, dispatchAndStop] = useMirroredCallback(
    key + ":stop",
    () => {
      if (!started) {
        return;
      }

      controller.current?.abort();
      controller.current = null;

      setStarted(false);
      setLocked(false);
    },
    [started, setStarted, setLocked],

    /** Mirror */
    mirror
  );

  /** Toggle */
  const [toggle, dispatchAndToggle] = useMirroredCallback(
    key + ":toggle",
    (status) => {
      if (typeof status === "boolean") {
        return status ? start() : stop();
      } else if (!started) {
        return start();
      } else {
        return stop();
      }
    },
    [started, start, stop],

    /** Mirror */
    mirror
  );

  /** Lock Process */
  const lock = useCallback(() => setLocked(true), [setLocked]);

  /** Unlock Process */
  const unlock = useCallback(() => setLocked(false), [setLocked]);

  /** Execute A Callback */
  const execute = useCallback(
    async (callback) => {
      /** Lock */
      lock();

      /** Should Stop? */
      if (await callback()) {
        stop();
      } else {
        unlock();
      }
    },
    [lock, unlock, stop]
  );

  /** Terminate on Unmount */
  useEffect(() => {
    return () => {
      controller.current?.abort();
    };
  }, []);

  return useValuesMemo({
    key,
    started,
    locked,
    canExecute,
    controller,
    start,
    stop,
    toggle,
    lock,
    unlock,
    execute,
    dispatchAndStart,
    dispatchAndStop,
    dispatchAndToggle,
  });
}
