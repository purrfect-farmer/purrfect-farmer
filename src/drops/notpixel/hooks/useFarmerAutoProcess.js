import useFarmerContext from "@/hooks/useFarmerContext";

import useFarmerAutoTask from "./useFarmerAutoTask";

export default function useFarmerAutoProcess(task, check, start) {
  const { processNextTask } = useFarmerContext();
  return useFarmerAutoTask(
    task,
    () => {
      if (check) {
        /** @type {AbortController} */
        let controller;

        /** Start the Process */
        start((process) => {
          controller = process.controller;
          controller.signal.addEventListener("abort", processNextTask);
        });

        /** Abort on Skip */
        return () => {
          controller.signal.removeEventListener("abort", processNextTask);
          controller.abort();
        };
      }
    },
    [check, start, processNextTask]
  );
}
