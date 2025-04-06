import useFarmerContext from "@/hooks/useFarmerContext";
import { useCallback, useLayoutEffect } from "react";

export default function useFarmerAutoTask(task, callback, deps = []) {
  const { isZooming, zoomies } = useFarmerContext();
  const isCurrentTask = zoomies.current.task === task;

  const effectCallback = useCallback(callback, [...deps]);

  useLayoutEffect(() => {
    if (isZooming && isCurrentTask) {
      return effectCallback(zoomies);
    }
  }, [isZooming, isCurrentTask, effectCallback]);
}
