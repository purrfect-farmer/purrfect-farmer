import useFarmerContext from "@/hooks/useFarmerContext";
import { useRef } from "react";

import useFarmerAutoTask from "./useFarmerAutoTask";

export default function useFarmerAutoProcess(task, check, start) {
  const { processNextTask } = useFarmerContext();
  const controllerRef = useRef(null);

  return useFarmerAutoTask(
    task,
    () => {
      if (check) {
        /** Start the Process */
        start((process) => {
          /** Set Controller */
          controllerRef.current = process.controller;

          /** Add Abort Listener */
          controllerRef.current.signal.addEventListener(
            "abort",
            processNextTask
          );
        });

        /** Abort on Skip */
        return () => {
          if (controllerRef.current) {
            /** Remove Abort Listener */
            controllerRef.current.signal.removeEventListener(
              "abort",
              processNextTask
            );

            /** Abort */
            controllerRef.current.abort();
          }

          /** Reset Ref */
          controllerRef.current = null;
        };
      }
    },
    [check, start, processNextTask]
  );
}
