import useFarmerContext from "@/hooks/useFarmerContext";

import useFarmerAutoTask from "./useFarmerAutoTask";

export default function useFarmerAutoProcess(task, check, start) {
  const { processNextTask } = useFarmerContext();
  return useFarmerAutoTask(
    task,
    () => {
      if (check) {
        start((process) => {
          process.controller.signal.addEventListener("abort", processNextTask);
        });
      }
    },
    [check, start, processNextTask]
  );
}
