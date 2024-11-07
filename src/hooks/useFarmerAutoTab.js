import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";

import useFarmerContext from "./useFarmerContext";

export default function useFarmerAutoTab(onValueChange) {
  const { autoTasks } = useFarmerContext();

  /** Auto-Tab */
  autoTasks.forEach((task) => {
    useFarmerAutoTask(
      task,
      (zoomies) => {
        onValueChange(zoomies.currentTask.split(".")[0]);
      },
      [onValueChange]
    );
  });
}
