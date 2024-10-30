import { useCallback } from "react";
import { useMemo } from "react";

import useAppContext from "./useAppContext";

export default function useSocketDispatchCallback(main, dispatch, socket) {
  const app = useAppContext();
  const socketToUse = socket || app?.socket;

  /** Callback that dispatch and calls main */
  const dispatchAndCallMain = useCallback(
    (...args) => {
      dispatch(socketToUse, ...args);
      return main(...args);
    },
    [main, dispatch, socketToUse]
  );

  return useMemo(
    () => [main, dispatchAndCallMain],
    [main, dispatchAndCallMain]
  );
}
