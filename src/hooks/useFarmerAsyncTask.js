import useFarmerContext from "@/hooks/useFarmerContext";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

export default function useFarmerAsyncTask(task, callback, deps = []) {
  const { isZooming, zoomies, processNextTask } = useFarmerContext();
  const [isProcessed, setIsProcessed] = useState(false);
  const lockRef = useRef(false);

  /** Run the Effect */
  useEffect(() => {
    /** Prevent Re-Renders */
    if (lockRef.current) return;

    /** Get the return value */
    const returnValue = callback(zoomies);

    if (returnValue instanceof Promise) {
      /** Lock Status... */
      lockRef.current = true;

      returnValue?.finally(() => {
        /** Mark as Processed */
        setIsProcessed(true);

        /** Unlock Status... */
        lockRef.current = false;
      });
    }
  }, deps);

  /** Process Next Task */
  useEffect(() => {
    if (isZooming && zoomies.current.task === task && isProcessed) {
      processNextTask();
    }
  }, [task, isProcessed, isZooming, zoomies.current.task, processNextTask]);
}
