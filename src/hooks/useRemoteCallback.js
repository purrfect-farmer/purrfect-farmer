import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";

import useAppContext from "./useAppContext";

export default function useRemoteCallback(action, callback, deps = [], remote) {
  const app = useAppContext();
  const remoteToUse = remote || app?.remote;

  /** Main Callback */
  const main = useCallback(callback, deps);

  /** Dispatch Callback */
  const dispatch = useCallback(
    (...args) => {
      remoteToUse.dispatch({
        action,
        data: args,
      });

      return main(...args);
    },
    [remoteToUse, action, main]
  );

  /** Add Handler */
  useLayoutEffect(() => {
    /** Create Handler */
    const handler = (command) => main(...command.data);

    /** Add Handler */
    remoteToUse.handler.on(action, handler);

    /** Remove Handler */
    return () => remoteToUse.handler.off(action, handler);
  }, [remoteToUse.handler, action, main]);

  return useMemo(() => [main, dispatch], [main, dispatch]);
}
