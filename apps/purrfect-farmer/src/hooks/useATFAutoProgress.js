import { useCallback, useState } from "react";

export default function useATFAutoProgress() {
  const [target, setTarget] = useState(0);
  const [progress, setProgress] = useState(0);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setTarget(0);
  }, []);

  const incrementProgress = useCallback(
    () => setProgress((prev) => prev + 1),
    []
  );

  return {
    target,
    setTarget,
    progress,
    resetProgress,
    incrementProgress,
  };
}
