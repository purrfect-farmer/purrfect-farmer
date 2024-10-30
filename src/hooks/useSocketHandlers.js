import { useEffect } from "react";

import useAppContext from "./useAppContext";

export default function useSocketHandlers(handlers, socket) {
  const app = useAppContext();

  const socketToUse = socket || app?.socket;

  return useEffect(() => {
    socketToUse.addCommandHandlers(handlers);

    return () => {
      socketToUse.removeCommandHandlers(handlers);
    };
  }, [socketToUse, handlers]);
}
