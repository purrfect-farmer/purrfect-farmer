import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";
import { useMemo } from "react";

import useFarmerContext from "./useFarmerContext";

export default function useFarmerAutoTab(onValueChange) {
  const { zoomies } = useFarmerContext();
  const tasks = useMemo(() => zoomies.current.drop?.tasks || [], []);

  /** Auto-Tab */
  tasks.forEach((task) => {
    useFarmerAutoTask(
      task,
      (zoomies) => {
        onValueChange(zoomies.current.task?.split(".")[0]);
      },
      [onValueChange]
    );
  });
}
