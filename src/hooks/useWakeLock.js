import { useEffect, useRef } from "react";

export default function useWakeLock() {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        wakeLockRef.current?.release();
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch (e) {
        console.error(e);
      }
    };

    const handleVisibilityChange = async () => {
      if (
        wakeLockRef.current !== null &&
        document.visibilityState === "visible"
      ) {
        await requestWakeLock();
      }
    };

    /** Watch Visibility Change */
    document.addEventListener("visibilitychange", handleVisibilityChange);

    /** Request initial WakeLock */
    requestWakeLock();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);
}
