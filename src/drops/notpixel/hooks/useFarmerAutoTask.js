import useFarmerContext from "@/hooks/useFarmerContext";
import { useEffect } from "react";

export default function useFarmerAutoTask(task, callback, deps = []) {
  const { id, zoomies } = useFarmerContext();

  useEffect(() => {
    if (
      zoomies.enabled !== true ||
      zoomies.currentDrop?.id !== id ||
      zoomies.currentTask !== task
    ) {
      return;
    } else {
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
