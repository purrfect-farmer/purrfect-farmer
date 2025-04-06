import { memo, useEffect } from "react";
import { useState } from "react";

export default memo(function Crasher({ delay = 1000 }) {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error("CRASHER");
  }

  /** Run Crash Effect */
  useEffect(() => {
    let timeout = setTimeout(() => setShouldCrash(true), delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [delay]);
});
