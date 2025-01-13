import { useLayoutEffect } from "react";

import useAppContext from "./useAppContext";

export default function useSocketHandlers(handlers, socket) {
  const app = useAppContext();
  const socketToUse = socket || app?.socket;

  return useLayoutEffect(() => {
    socketToUse.addCommandHandlers(handlers);

    return () => {
      socketToUse.removeCommandHandlers(handlers);
    };
  }, [
    handlers,
    socketToUse.addCommandHandlers,
    socketToUse.removeCommandHandlers,
  ]);
}
