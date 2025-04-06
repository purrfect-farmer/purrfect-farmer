import useFarmerAutoTask from "@/hooks/useFarmerAutoTask";
import { useMemo } from "react";

import useFarmerContext from "./useFarmerContext";

export default function useFarmerAutoTab(tabs) {
  const { farmer, zoomies } = useFarmerContext();
  const currentTask = zoomies.current.task;
  const currentTab = useMemo(
    () => currentTask && currentTask.split(".")[0],
    [currentTask]
  );

  /** Auto-Tab */
  farmer.tasks.all.forEach((task) => {
    useFarmerAutoTask(
      task,
      () => {
        /** Set the Tab */
        if (tabs.list.includes(currentTab)) {
          tabs.setValue(currentTab);
        }
      },
      [currentTab, tabs.list, tabs.setValue]
    );
  });
}
