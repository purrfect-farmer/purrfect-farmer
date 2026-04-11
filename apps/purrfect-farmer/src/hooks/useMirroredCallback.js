import { customLogger } from "@/utils";
import useAccountContext from "./useAccountContext";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import useSharedContext from "./useSharedContext";
import useSyncedRef from "./useSyncedRef";

export default function useMirroredCallback(
  action,
  callback,
  deps = [],
  mirror,
) {
  const shared = useSharedContext();
  const account = useAccountContext();
  const mirrorToUse = mirror || shared.mirror;
  const isActive = !account || account.active;

  /** Store Active State in Ref */
  const activeStateRef = useSyncedRef(isActive && mirrorToUse.mirroring);

  /** Main Callback */
  const main = useCallback(callback, deps);

  /** Broadcast */
  const broadcast = useCallback(
    (...args) => {
      try {
        mirrorToUse.dispatch({
          action,
          data: args,
        });
      } catch (e) {
        customLogger("DISPATCH ERROR", e);
      }
    },
    [action, mirrorToUse],
  );

  /** Dispatch Callback */
  const dispatch = useCallback(
    (...args) => {
      if (activeStateRef.current) {
        broadcast(...args);
      }
      return main(...args);
    },
    [broadcast, main],
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

  return useMemo(
    () => [main, dispatch, broadcast],
    [main, dispatch, broadcast],
  );
}
