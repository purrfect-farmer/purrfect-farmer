import { useMemo } from "react";
import { useState } from "react";

import useMirroredCallback from "./useMirroredCallback";

export default function useMirroredState(key = "", initialState, mirror) {
  const [state, setState] = useState(initialState);

  /** Change State Handler */
  const [, dispatchAndSetState] = useMirroredCallback(
    key + ":set",
    /** Main */
    setState,
    [setState],
    mirror
  );

  return useMemo(
    () => [state, setState, dispatchAndSetState],
    [state, setState, dispatchAndSetState]
  );
}
