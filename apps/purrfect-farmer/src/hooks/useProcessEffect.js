import { useEffect } from "react";

export default function useProcessEffect(process, callback, deps = []) {
  useEffect(() => {
    if (process.started && process.locked === false) {
      return process.execute(callback);
    }
  }, [process, ...deps]);
}
