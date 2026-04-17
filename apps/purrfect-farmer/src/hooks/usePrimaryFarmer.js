import {
  getPrimaryFarmerLinkStorageKey,
  getPrimaryFarmerUserIdStorageKey,
} from "@/utils";

import storage from "@/lib/storage";
import { useMemo } from "react";
import useMirroredHandlers from "./useMirroredHandlers";
import useRefCallback from "./useRefCallback";

export default function usePrimaryFarmer(mirror) {
  /** Dispatch to get the primary farmer link */
  const dispatchToGetPrimaryFarmerLink = useRefCallback(
    (id) => {
      console.log("Dispatching to get primary farmer link:", id);
      return mirror.dispatch({
        action: "get-primary-farmer-link",
        data: {
          id,
        },
      });
    },
    [mirror.dispatch],
  );

  /** Dispatch to set the primary farmer link */
  const dispatchToSetPrimaryFarmerLink = useRefCallback(
    (id, link) => {
      console.log("Dispatching to set primary farmer link:", { id, link });
      return mirror.dispatch({
        action: "set-primary-farmer-link",
        data: {
          id,
          link,
        },
      });
    },
    [mirror.dispatch],
  );

  /** Dispatch to set the primary farmer user ID */
  const dispatchToSetPrimaryFarmerUserId = useRefCallback(
    (id, userId) => {
      console.log("Dispatching to set primary farmer user ID:", {
        id,
        userId,
      });
      return mirror.dispatch({
        action: "set-primary-farmer-user-id",
        data: {
          id,
          userId,
        },
      });
    },
    [mirror.dispatch],
  );

  /** Handle primary farmer link */
  useMirroredHandlers(
    useMemo(() => {
      return {
        /** Get primary farmer link */
        ["get-primary-farmer-link"]: (message) => {
          const { id } = message.data;
          const link = storage.get(getPrimaryFarmerLinkStorageKey(id));

          if (link) {
            dispatchToSetPrimaryFarmerLink(id, link);
          }
        },

        /** Set primary farmer link */
        ["set-primary-farmer-link"]: (message) => {
          const { id, link } = message.data;
          console.log("Storing primary farmer link:", { id, link });
          storage.set(getPrimaryFarmerLinkStorageKey(id), link);
        },

        /** Set primary farmer user ID */
        ["set-primary-farmer-user-id"]: (message) => {
          const { id, userId } = message.data;
          console.log("Storing primary farmer user ID:", { id, userId });
          storage.set(getPrimaryFarmerUserIdStorageKey(id), userId);
        },
      };
    }, [dispatchToSetPrimaryFarmerLink]),
    mirror,
  );

  return {
    dispatchToGetPrimaryFarmerLink,
    dispatchToSetPrimaryFarmerLink,
    dispatchToSetPrimaryFarmerUserId,
  };
}
