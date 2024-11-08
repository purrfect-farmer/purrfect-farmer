import EventEmitter from "events";
import { useCallback } from "react";
import { useMemo } from "react";

export default function useEventEmitter() {
  /** Emitter */
  const emitter = useMemo(() => new EventEmitter(), []);

  /** Set listeners */
  const addListeners = useCallback(
    (items, once = false) => {
      Object.entries(items).forEach(([k, v]) =>
        once ? emitter.once(k, v) : emitter.on(k, v)
      );
    },
    [emitter]
  );

  /** Remove listeners */
  const removeListeners = useCallback(
    (items) => {
      Object.entries(items).forEach(([k, v]) => emitter.off(k, v));
    },
    [emitter]
  );

  return useMemo(
    () => ({ emitter, addListeners, removeListeners }),
    [emitter, addListeners, removeListeners]
  );
}
