import { useLayoutEffect } from "react";

import useAppContext from "./useAppContext";

export default function useSocketHandlers(handlers, remote) {
  const app = useAppContext();
  const remoteToUse = remote || app?.remote;

  return useLayoutEffect(() => {
    remoteToUse.addCommandHandlers(handlers);

    return () => {
      remoteToUse.removeCommandHandlers(handlers);
    };
  }, [
    handlers,
    remoteToUse.addCommandHandlers,
    remoteToUse.removeCommandHandlers,
  ]);
}
