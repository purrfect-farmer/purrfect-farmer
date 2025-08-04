import { useLayoutEffect } from "react";

import useAppContext from "./useAppContext";

export default function useMirroredHandlers(handlers, mirror) {
  const app = useAppContext();
  const mirrorToUse = mirror || app?.mirror;

  return useLayoutEffect(() => {
    mirrorToUse.addCommandHandlers(handlers);

    return () => {
      mirrorToUse.removeCommandHandlers(handlers);
    };
  }, [
    handlers,
    mirrorToUse.addCommandHandlers,
    mirrorToUse.removeCommandHandlers,
  ]);
}
