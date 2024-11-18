import { useCallback } from "react";
import { useMemo } from "react";
import useAppContext from "./useAppContext";
import { useEffect } from "react";

export default function useSocketDispatchCallback(
  action,
  callback,
  deps = [],
  socket
) {
  const app = useAppContext();
  const socketToUse = socket || app?.socket;

  /** Main Callback */
  const main = useCallback(callback, deps);

  /** Dispatch Callback */
  const dispatch = useCallback(
    (...args) => {
      socketToUse.dispatch({
        action,
        data: args,
      });

      return main(...args);
    },
    [socketToUse, action, main]
  );

  /** Add Handler */
  useEffect(() => {
    /** Create Handler */
    const handler = (command) => main(...command.data);

    /** Add Handler */
    socketToUse.handler.on(action, handler);

    /** Remove Handler */
    return () => socketToUse.handler.off(action, handler);
  }, [socketToUse.handler, action, main]);

  return useMemo(() => [main, dispatch], [main, dispatch]);
}
