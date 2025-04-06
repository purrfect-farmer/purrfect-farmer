import useFarmerAutoTask from "@/hooks/useFarmerAutoTask";
import { useMemo } from "react";

import useFarmerContext from "./useFarmerContext";

export default function useFarmerAutoTab(tabs) {
  const { zoomies } = useFarmerContext();
  const tasks = useMemo(() => zoomies.current.drop?.tasks || [], []);
  const currentTab = useMemo(
    () => zoomies.current.task && zoomies.current.task.split(".")[0],
    [zoomies.current.task]
  );

  /** Auto-Tab */
  tasks.forEach((task) => {
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
