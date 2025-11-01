import { customLogger } from "@/lib/utils";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";

import useSyncedRef from "./useSyncedRef";
import useSharedContext from "./useSharedContext";
import useAccountContext from "./useAccountContext";

export default function useMirroredCallback(
  action,
  callback,
  deps = [],
  mirror
) {
  const shared = useSharedContext();
  const account = useAccountContext();
  const mirrorToUse = mirror || shared.mirror;
  const isActive = !account || account.active;

  /** Store Active State in Ref */
  const activeStateRef = useSyncedRef(isActive && mirrorToUse.mirroring);

  /** Main Callback */
  const main = useCallback(callback, deps);

  /** Dispatch Callback */
  const dispatch = useCallback(
    (...args) => {
      if (activeStateRef.current) {
        try {
          mirrorToUse.dispatch({
            action,
            data: args,
          });
        } catch (e) {
          customLogger("DISPATCH ERROR", e);
        }
      }

      return main(...args);
    },
    [mirrorToUse, action, main]
  );

  /** Add Handler */
  useLayoutEffect(() => {
    /** Create Handler */
    const handler = (command) => {
      if (activeStateRef.current) {
        main(...command.data);
      }
    };

    /** Add Handler */
    mirrorToUse.handler.on(action, handler);

    /** Remove Handler */
    return () => mirrorToUse.handler.off(action, handler);
  }, [mirrorToUse.handler, action, main]);

  return useMemo(() => [main, dispatch], [main, dispatch]);
}
