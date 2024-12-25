import { useLayoutEffect } from "react";
import { useState } from "react";

import useFarmerAutoTask from "./useFarmerAutoTask";

export default function useFarmerAsyncTask(task, effect, deps = []) {
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  /** Run the Effect */
  useLayoutEffect(() => {
    if (isRunning) return;
    /** Get the callback */
    const callback = effect();

    if (callback) {
      /** Lock */
      setIsRunning(true);

      /** Run Callback */
      callback().finally(() => {
        /** Mark as Processed */
        setIsProcessed(true);

        /** Unlock */
        setIsRunning(false);
      });
    }
  }, [isRunning, ...deps]);

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
