import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useState } from "react";

import useFarmerAutoTask from "./useFarmerAutoTask";
import useFarmerContext from "./useFarmerContext";

export default function useFarmerAsyncTask(task, effect, deps = []) {
  const { isZooming, zoomies } = useFarmerContext();

  const depsChangedRef = useRef(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  const isQuickRun = zoomies.quickRun;
  const isCurrentZoomiesTask = zoomies.current.task === task;
  const shouldSkip = isZooming && isQuickRun && isCurrentZoomiesTask === false;

  const canProcess = useMemo(() => deps.every(Boolean), [...deps]);
  const effectCallback = useCallback(effect, [...deps]);

  /** Indicate Deps Changed */
  useLayoutEffect(() => {
    depsChangedRef.current = true;
  }, [effectCallback]);

  /** Set the callback */
  useLayoutEffect(() => {
    if (
      shouldSkip ||
      isRunning ||
      canProcess === false ||
      depsChangedRef.current === false
    ) {
      return;
    } else {
      /** Set Deps Changed to False */
      depsChangedRef.current = false;

      /** Mark as Running */
      setIsRunning(true);

      effectCallback()
        .catch((e) => console.error(e))
        .finally(() => {
          /** Mark as Processed */
          setIsProcessed(true);

          /** Unlock */
          setIsRunning(false);
        });
    }
  }, [shouldSkip, isRunning, canProcess, effectCallback]);

  /** Process Next Task */
  useFarmerAutoTask(
    task,
    (zoomies) => {
      if (isRunning === false && isProcessed) {
        zoomies.processNextTask();
      }
    },
    [isRunning, isProcessed]
  );
}
