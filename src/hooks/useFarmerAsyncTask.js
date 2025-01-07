import { useEffect } from "react";
import { useLayoutEffect } from "react";
import { useState } from "react";

import useFarmerAutoTask from "./useFarmerAutoTask";
import useFarmerContext from "./useFarmerContext";

export default function useFarmerAsyncTask(task, effect, deps = []) {
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [callback, setCallback] = useState(null);
  const { isZooming, zoomies } = useFarmerContext();

  /** Set the callback */
  useLayoutEffect(() => {
    /** Get the return value */
    const returnValue = effect();

    /** Set the Callback */
    setCallback(() => returnValue || null);
  }, [...deps]);

  /** Run effect */
  useEffect(() => {
    /** Don't run task concurrently during Quick Run Zoomies */
    if (isZooming && zoomies.quickRun && zoomies.current.task !== task) {
      return;
    }

    /** Check if task is running */
    if (!callback || isRunning) return;

    /** Lock */
    setIsRunning(true);

    /** Clear Callback */
    setCallback(null);

    /** Run Callback */
    callback().finally(() => {
      /** Mark as Processed */
      setIsProcessed(true);

      /** Unlock */
      setIsRunning(false);
    });
  }, [
    task,
    callback,
    isRunning,
    isZooming,
    zoomies.quickRun,
    zoomies.current.task,
  ]);

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
