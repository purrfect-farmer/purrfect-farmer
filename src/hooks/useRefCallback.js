import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useRef } from "react";

export default function useRefCallback(...args) {
  const callback = useCallback(...args);
  const ref = useRef(callback);

  const staticCallback = useCallback((...args) => {
    return ref.current(...args);
  }, []);

  useLayoutEffect(() => {
    ref.current = callback;
  }, [callback]);

  return staticCallback;
}
