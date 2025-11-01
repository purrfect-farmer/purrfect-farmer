import { useLayoutEffect } from "react";

import useSharedContext from "./useSharedContext";

export default function useMirroredHandlers(handlers, mirror) {
  const shared = useSharedContext();
  const mirrorToUse = mirror || shared?.mirror;

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
