import useFarmerContext from "@/hooks/useFarmerContext";
import { useEffect } from "react";

export default function useFarmerAutoTask(task, callback, deps = []) {
  const { isZooming, zoomies } = useFarmerContext();

  useEffect(() => {
    if (isZooming && zoomies.current.task === task) {
      return callback(zoomies);
    }
  }, [task, isZooming, zoomies.current.task, ...deps]);
}
