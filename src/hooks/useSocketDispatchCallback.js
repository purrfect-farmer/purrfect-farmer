import { useCallback } from "react";
import { useMemo } from "react";

import useAppContext from "./useAppContext";

export default function useSocketDispatchCallback(main, dispatch) {
  const { socket } = useAppContext();

  /** Callback that dispatch and calls main */
  const dispatchAndCallMain = useCallback(
    (...args) => {
      dispatch(socket, ...args);
      return main(...args);
    },
    [main, dispatch, socket]
  );

  return useMemo(
    () => [main, dispatchAndCallMain],
    [main, dispatchAndCallMain]
  );
}
