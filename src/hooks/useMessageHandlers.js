import useAppContext from "./useAppContext";
import { useLayoutEffect } from "react";

export default function useMessageHandlers(handlers, messaging) {
  const app = useAppContext();

  const messagingToUse = messaging || app.messaging;

  return useLayoutEffect(() => {
    messagingToUse.addMessageHandlers(handlers);

    return () => {
      messagingToUse.removeMessageHandlers(handlers);
    };
  }, [messagingToUse, handlers]);
}
