import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useRef } from "react";

export default function useRefCallback(...args) {
  const callback = useCallback(...args);
  const ref = useRef(callback);

  /** Update Ref */
  useLayoutEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback((...args) => {
    return ref.current(...args);
  }, []);
}
