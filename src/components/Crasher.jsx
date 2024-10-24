import { useEffect } from "react";
import { useState } from "react";

export default function Crasher({ delay = 1000 }) {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw 5;
  }

  /** Run Crash Effect */
  useEffect(() => {
    let timeout = setTimeout(() => setShouldCrash(true), delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [delay]);
}
