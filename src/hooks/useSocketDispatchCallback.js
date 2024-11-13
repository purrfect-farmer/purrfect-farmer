import { useCallback } from "react";
import { useId } from "react";
import { useMemo } from "react";

import useAppContext from "./useAppContext";
import useSocketHandlers from "./useSocketHandlers";

export default function useSocketDispatchCallback(callback, deps = [], socket) {
  const app = useAppContext();
  const socketToUse = socket || app?.socket;

  const id = useId();
  const callbackAction = "dispatch-callback-" + id;

  /** Main Callback */
  const main = useCallback(callback, deps);

  /** Dispatch Callback */
  const dispatch = useCallback(
    (...args) => {
      socketToUse.dispatch({
        action: callbackAction,
        data: args,
      });

      return main(...args);
    },
    [socketToUse, callbackAction, main]
  );

  /** Add Handler */
  useSocketHandlers(
    useMemo(
      () => ({
        [callbackAction]: (command) => main(...command.data),
      }),
      [callbackAction, main]
    ),
    /** Socket */
    socketToUse
  );

  return useMemo(() => [main, dispatch], [main, dispatch]);
}
