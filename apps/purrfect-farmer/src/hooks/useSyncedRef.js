import { useRef } from "react";

export default function useSyncedRef(value) {
  const ref = useRef(value);

  if (ref.current !== value) {
    ref.current = value;
  }

  return ref;
}
