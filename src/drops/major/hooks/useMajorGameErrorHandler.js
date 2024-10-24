import toast from "react-hot-toast";
import { formatRelative } from "date-fns";
import { useCallback } from "react";

export default function useMajorGameErrorHandler() {
  return useCallback((e) => {
    // Catch Blocked
    const blocked = e.response?.data?.detail?.["blocked_until"];
    if (blocked) {
      toast.error(
        `Please wait till - ${formatRelative(
          new Date(blocked * 1000),
          new Date()
        )}`,
        {
          duration: 3000,
          className: "font-bold font-sans",
        }
      );
    } else {
      toast.error("Something went wrong!", {
        className: "font-bold font-sans",
      });
    }
  }, []);
}
