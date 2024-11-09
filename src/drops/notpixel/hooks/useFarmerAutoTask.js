import useFarmerContext from "@/hooks/useFarmerContext";
import { useLayoutEffect } from "react";

export default function useFarmerAutoTask(task, callback, deps = []) {
  const { id, zoomies } = useFarmerContext();

  useLayoutEffect(() => {
    if (
      zoomies.enabled &&
      zoomies.currentDrop?.id === id &&
      zoomies.currentTask === task
    ) {
      return callback(zoomies);
    }
  }, [
    zoomies.enabled,
    zoomies.currentDrop?.id,
    zoomies.currentTask,
    id,
    task,
    ...deps,
  ]);
}
