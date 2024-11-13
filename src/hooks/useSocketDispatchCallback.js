import { useCallback } from "react";
import { useId } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";

import useAppContext from "./useAppContext";

export default function useSocketDispatchCallback(callback, deps = [], socket) {
  const app = useAppContext();
  const socketToUse = socket || app?.socket;
  const callbackAction = "dispatch-callback-" + useId();

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
  useLayoutEffect(() => {
    /** Create Handler */
    const handler = (command) => main(...command.data);

    /** Add Handler */
    socketToUse.handler.on(callbackAction, handler);

    /** Remove Handler */
    return () => socketToUse.handler.off(callbackAction, handler);
  }, [socketToUse.handler, callbackAction, main]);

  return useMemo(() => [main, dispatch], [main, dispatch]);
}
