import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";
import { useMemo } from "react";

import useFarmerContext from "./useFarmerContext";

export default function useFarmerAutoTab(tabs) {
  const { zoomies } = useFarmerContext();
  const tasks = useMemo(() => zoomies.current.drop?.tasks || [], []);

  /** Auto-Tab */
  tasks.forEach((task) => {
    useFarmerAutoTask(
      task,
      (zoomies) => {
        tabs.setValue(zoomies.current.task?.split(".")[0]);
      },
      [tabs.setValue]
    );
  });
}
