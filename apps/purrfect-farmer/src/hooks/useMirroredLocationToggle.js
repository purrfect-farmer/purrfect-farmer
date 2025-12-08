import { useMemo } from "react";
import useLocationToggle from "./useLocationToggle";
import useMirroredCallback from "./useMirroredCallback";

export default function useMirroredLocationToggle(key = "", mirror) {
  /** Location Toggle State */
  const [show, toggle] = useLocationToggle(key);

  /** Toggle State Handler */
  const [, dispatchAndToggle] = useMirroredCallback(
    key + ":set",
    /** Main */
    toggle,
    [toggle],
    mirror
  );

  return useMemo(
    () => [show, toggle, dispatchAndToggle],
    [show, toggle, dispatchAndToggle]
  );
}
