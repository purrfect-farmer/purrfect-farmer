import { customLogger } from "@/lib/utils";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";

import useAppContext from "./useAppContext";

export default function useMirroredCallback(
  action,
  callback,
  deps = [],
  mirror
) {
  const app = useAppContext();
  const mirrorToUse = mirror || app?.mirror;

  /** Main Callback */
  const main = useCallback(callback, deps);

  /** Dispatch Callback */
  const dispatch = useCallback(
    (...args) => {
      try {
        mirrorToUse.dispatch({
          action,
          data: args,
        });
      } catch (e) {
        customLogger("DISPATCH ERROR", e);
      }

      return main(...args);
    },
    [mirrorToUse, action, main]
  );

  /** Add Handler */
  useLayoutEffect(() => {
    /** Create Handler */
    const handler = (command) => main(...command.data);

    /** Add Handler */
    mirrorToUse.handler.on(action, handler);

    /** Remove Handler */
    return () => mirrorToUse.handler.off(action, handler);
  }, [mirrorToUse.handler, action, main]);

  return useMemo(() => [main, dispatch], [main, dispatch]);
}
