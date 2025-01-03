import { useEffect } from "react";
import { useLayoutEffect } from "react";
import { useState } from "react";

import useFarmerAutoTask from "./useFarmerAutoTask";

export default function useFarmerAsyncTask(task, effect, deps = []) {
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [callback, setCallback] = useState(null);

  /** Set the callback */
  useLayoutEffect(() => {
    /** Get the return value */
    const returnValue = effect();

    /** Set the Callback */
    setCallback(() => returnValue || null);
  }, [...deps]);

  /** Run effect */
  useEffect(() => {
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
  }, [callback, isRunning]);

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
