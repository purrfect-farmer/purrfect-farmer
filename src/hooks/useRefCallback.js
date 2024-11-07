import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";

export default function useRefCallback(...args) {
  const callback = useCallback(...args);
  const ref = useRef(callback);

  const staticCallback = useCallback((...args) => {
    ref.current(...args);
  }, []);

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  return staticCallback;
}
