import useFarmerContext from "@/hooks/useFarmerContext";
import { useMemo, useRef } from "react";

import useFarmerAutoTask from "./useFarmerAutoTask";

export default function useFarmerAutoProcess(task, process, checks = []) {
  const { processNextTask } = useFarmerContext();
  const ref = useRef(null);
  const canProcess = useMemo(() => checks.every(Boolean), [...checks]);

  return useFarmerAutoTask(
    task,
    () => {
      if (canProcess) {
        /** Start the Process */
        process.start(({ controller }) => {
          /** Set Ref */
          ref.current = controller;

          /** Add Abort Listener */
          controller.signal.addEventListener("abort", processNextTask);
        });

        /** Stop Process */
        return () => {
          ref.current?.signal?.removeEventListener("abort", processNextTask);
          ref.current = null;
          process.stop();
        };
      }
    },
    [canProcess, process.start, process.stop, processNextTask]
  );
}
