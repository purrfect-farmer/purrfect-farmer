import { useLayoutEffect } from "react";
import { useRef } from "react";

export default function useSyncedRef(value) {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
