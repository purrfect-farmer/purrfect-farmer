import useFarmerContext from "@/hooks/useFarmerContext";
import { useEffect } from "react";

export default function useBirdTonHandlers(handlers) {
  const { addMessageHandlers, removeMessageHandlers } = useFarmerContext();

  return useEffect(() => {
    /** Add Handlers */
    addMessageHandlers(handlers);

    /** Remove Handlers */
    return () => {
      removeMessageHandlers(handlers);
    };
  }, [handlers, addMessageHandlers, removeMessageHandlers]);
}
