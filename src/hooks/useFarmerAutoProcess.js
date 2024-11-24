import useFarmerContext from "@/hooks/useFarmerContext";

import useFarmerAutoTask from "./useFarmerAutoTask";

export default function useFarmerAutoProcess(task, check, process) {
  const { processNextTask } = useFarmerContext();

  return useFarmerAutoTask(
    task,
    () => {
      if (check) {
        /** Start the Process */
        process.start(({ controller }) => {
          /** Add Abort Listener */
          controller.signal.addEventListener("abort", processNextTask);
        });

        /** Stop Process */
        return () => {
          process.stop();
        };
      }
    },
    [check, process.start, process.stop, processNextTask]
  );
}
