import { useEffect } from "react";
import { useRef } from "react";

export default function useSyncedRef(value) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
