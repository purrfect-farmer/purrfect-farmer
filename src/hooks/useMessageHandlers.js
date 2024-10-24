import { useEffect } from "react";

import useAppContext from "./useAppContext";

export default function useMessageHandlers(handlers) {
  const { messaging } = useAppContext();

  return useEffect(() => {
    messaging.addMessageHandlers(handlers);

    return () => {
      messaging.removeMessageHandlers(handlers);
    };
  }, [messaging, handlers]);
}
