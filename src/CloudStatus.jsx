import { HiOutlineCloud } from "react-icons/hi2";
import { useContext } from "react";

import AppContext from "./contexts/AppContext";
import useCloudStatusQuery from "./hooks/useCloudStatusQuery";
import { cn } from "./lib/utils";

export default function CloudStatus() {
  const { settings } = useContext(AppContext);
  const { status, data } = useCloudStatusQuery();

  return settings.enableCloudSync ? (
    <p
      className={cn(
        "text-center flex items-center justify-center gap-2",
        {
          pending: "text-orange-500",
          success: "text-green-500",
          error: "text-red-500",
        }[status]
      )}
    >
      <HiOutlineCloud className="w-4 h-4" /> Cloud:{" "}
      {status === "success"
        ? "Active"
        : status === "pending"
        ? "Checking"
        : "Error"}
    </p>
  ) : null;
}
