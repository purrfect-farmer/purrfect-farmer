import { useMemo } from "react";
import { useState } from "react";

import useRemoteCallback from "./useRemoteCallback";

export default function useSocketState(key = "", initialState) {
  const [state, setState] = useState(initialState);

  /** Change State Handler */
  const [, dispatchAndSetState] = useRemoteCallback(
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
