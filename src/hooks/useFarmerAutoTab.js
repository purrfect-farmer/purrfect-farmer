import useFarmerAutoTask from "@/hooks/useFarmerAutoTask";
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
        /** Split to Get Tab */
        const tab = zoomies.current.task?.split(".")[0];

        /** Set the Tab */
        if (tabs.list.includes(tab)) {
          tabs.setValue(tab);
        }
      },
      [tabs.list, tabs.setValue]
    );
  });
}
