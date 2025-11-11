import { useCallback, useState } from "react";

const useProgress = () => {
  const [progress, setProgress] = useState(0);

  const resetProgress = useCallback(() => setProgress(0), []);
  const incrementProgress = useCallback(
    () => setProgress((prev) => prev + 1),
    []
  );

  return {
    progress,
    resetProgress,
    incrementProgress,
  };
};

export { useProgress };
