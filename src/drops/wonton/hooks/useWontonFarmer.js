import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import WontonIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useWontonFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "wonton",
        host: "www.wonton.restaurant",
        notification: {
          icon: WontonIcon,
          title: "Wonton Farmer",
        },
        domains: ["*.wonton.food"],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        farmingStatusRequest: "https://wonton.food/api/v1/user/farming-status",
        tasksRequest: "https://wonton.food/api/v1/task/list",
        userRequest: "https://wonton.food/api/v1/user",
      }),
      []
    )
  );

  return useMemo(
    () => ({
      ...farmer,
      ...requests,
    }),
    [farmer, requests]
  );
}
