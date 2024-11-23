import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import useFarmerAutoTask from "./useFarmerAutoTask";

export default function useFarmerAsyncTask(task, callback, deps = []) {
  const [isProcessed, setIsProcessed] = useState(false);
  const lockRef = useRef(false);

  /** Run the Effect */
  useEffect(() => {
    /** Prevent Re-Renders */
    if (lockRef.current) return;

    /** Get the return value */
    const returnValue = callback();

    if (returnValue instanceof Promise) {
      /** Lock Status... */
      lockRef.current = true;

      returnValue?.finally(() => {
        /** Mark as Processed */
        setIsProcessed(true);
      });
    }
  }, [lockRef.current, ...deps]);

  /** Process Next Task */
  useFarmerAutoTask(
    task,
    (zoomies) => {
      if (isProcessed) {
        zoomies.processNextTask();
      }
    },
    [isProcessed]
  );
}
