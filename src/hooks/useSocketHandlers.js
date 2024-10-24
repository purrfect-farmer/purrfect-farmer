import { useEffect } from "react";

import useAppContext from "./useAppContext";

export default function useSocketHandlers(handlers) {
  const { socket } = useAppContext();

  return useEffect(() => {
    socket.addCommandHandlers(handlers);

    return () => {
      socket.removeCommandHandlers(handlers);
    };
  }, [socket, handlers]);
}
