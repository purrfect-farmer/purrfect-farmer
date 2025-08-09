import { useLayoutEffect } from "react";

import useRefCallback from "./useRefCallback";

export default function useDropFarmerZoomies({
  id,
  zoomies,
  started,
  telegramWebApp,
  initResetCount,
}) {
  /** Is It Zooming? */
  const isZooming = zoomies.enabled && zoomies.current.drop?.id === id;

  /**  Next task callback */
  const processNextTask = useRefCallback(zoomies.processNextTask);

  /** Set Started */
  useLayoutEffect(() => {
    if (isZooming) {
      zoomies.setFarmerHasStarted(started);
    }
  }, [started, isZooming, zoomies.setFarmerHasStarted]);

  /** Process Next Drop After 3 Init Reset */
  useLayoutEffect(() => {
    if (isZooming && initResetCount >= 3) {
      zoomies.skipToNextDrop();
    }
  }, [isZooming, initResetCount, zoomies.skipToNextDrop]);

  /** Process Next Drop if Unable to Start within 30sec */
  useLayoutEffect(() => {
    if (isZooming && telegramWebApp && !started) {
      /** Set Timeout */
      const timeout = setTimeout(zoomies.skipToNextDrop, 30_000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isZooming, started, telegramWebApp, zoomies.skipToNextDrop]);

  return {
    isZooming,
    processNextTask,
  };
}
