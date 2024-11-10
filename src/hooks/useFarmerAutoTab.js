import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";

import useFarmerContext from "./useFarmerContext";

export default function useFarmerAutoTab(onValueChange) {
  const { tasks } = useFarmerContext();

  /** Auto-Tab */
  tasks.forEach((task) => {
    useFarmerAutoTask(
      task,
      (zoomies) => {
        onValueChange(zoomies.current.task.split(".")[0]);
      },
      [onValueChange]
    );
  });
}
