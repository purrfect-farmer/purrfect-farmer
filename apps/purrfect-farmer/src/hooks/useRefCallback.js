import { useCallback } from "react";
import { useRef } from "react";

export default function useRefCallback(func, deps) {
  const callback = useCallback(func, deps);
  const ref = useRef(callback);

  /** Update Ref */
  if (ref.current !== callback) {
    ref.current = callback;
  }

  return useCallback((...args) => {
    return ref.current(...args);
  }, []);
}
