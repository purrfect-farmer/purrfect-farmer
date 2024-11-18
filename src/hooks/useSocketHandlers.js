import useAppContext from "./useAppContext";
import { useEffect } from "react";

export default function useSocketHandlers(handlers, socket) {
  const app = useAppContext();
  const socketToUse = socket || app?.socket;

  return useEffect(() => {
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
