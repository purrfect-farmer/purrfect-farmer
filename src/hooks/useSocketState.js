import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useSocketDispatchCallback from "./useSocketDispatchCallback";
import useSocketHandlers from "./useSocketHandlers";

export default function useSocketState(key = "", initialState) {
  const [state, setState] = useState(initialState);

  /** Change State Handler */
  const [, dispatchAndSetState] = useSocketDispatchCallback(
    /** Main */
    setState,

    /** Dispatch */
    useCallback(
      (socket, newState) => {
        socket.dispatch({
          action: key,
          data: {
            value: newState,
          },
        });
      },
      [key]
    )
  );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        [key]: (command) => {
          setState(command.data.value);
        },
      }),
      [setState]
    )
  );

  return useMemo(
    () => [state, setState, dispatchAndSetState],
    [state, setState, dispatchAndSetState]
  );
}
