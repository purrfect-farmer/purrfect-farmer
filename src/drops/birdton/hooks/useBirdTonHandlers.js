import useFarmerContext from "@/hooks/useFarmerContext";
import { useLayoutEffect } from "react";

export default function useBirdTonHandlers(handlers) {
  const { addMessageHandlers, removeMessageHandlers } = useFarmerContext();

  return useLayoutEffect(() => {
    /** Add Handlers */
    addMessageHandlers(handlers);

    /** Remove Handlers */
    return () => {
      removeMessageHandlers(handlers);
    };
  }, [handlers, addMessageHandlers, removeMessageHandlers]);
}
