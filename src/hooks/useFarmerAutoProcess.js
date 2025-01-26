import useFarmerContext from "@/hooks/useFarmerContext";
import { useRef } from "react";

import useFarmerAutoTask from "./useFarmerAutoTask";

export default function useFarmerAutoProcess(task, check, process) {
  const { processNextTask } = useFarmerContext();
  const ref = useRef(null);

  return useFarmerAutoTask(
    task,
    () => {
      if (check) {
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
    [check, process.start, process.stop, processNextTask]
  );
}
