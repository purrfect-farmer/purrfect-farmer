import { useEffect } from "react";
import useAppContext from "./useAppContext";

export default function useMessageHandlers(handlers, messaging) {
  const app = useAppContext();

  const messagingToUse = messaging || app.messaging;

  return useEffect(() => {
    messagingToUse.addMessageHandlers(handlers);

    return () => {
      messagingToUse.removeMessageHandlers(handlers);
    };
  }, [messagingToUse, handlers]);
}
