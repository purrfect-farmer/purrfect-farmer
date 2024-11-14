import { useMemo } from "react";
import { useState } from "react";

import useSocketDispatchCallback from "./useSocketDispatchCallback";

export default function useSocketState(key = "", initialState) {
  const [state, setState] = useState(initialState);

  /** Change State Handler */
  const [, dispatchAndSetState] = useSocketDispatchCallback(
    key + ":set",
    /** Main */
    setState,
    [setState]
  );

  return useMemo(
    () => [state, setState, dispatchAndSetState],
    [state, setState, dispatchAndSetState]
  );
}
