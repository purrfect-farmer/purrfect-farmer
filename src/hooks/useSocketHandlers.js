import useAppContext from "./useAppContext";
import { useLayoutEffect } from "react";

export default function useSocketHandlers(handlers, socket) {
  const app = useAppContext();

  const socketToUse = socket || app?.socket;

  return useLayoutEffect(() => {
    socketToUse.addCommandHandlers(handlers);

    return () => {
      socketToUse.removeCommandHandlers(handlers);
    };
  }, [socketToUse, handlers]);
}
