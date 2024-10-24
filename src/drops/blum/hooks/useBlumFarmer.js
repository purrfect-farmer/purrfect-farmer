import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import BlumIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useBlumFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "blum",
        host: "telegram.blum.codes",
        notification: {
          icon: BlumIcon,
          title: "Blum Farmer",
        },
        domains: ["*.blum.codes"],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        nowRequest: "https://game-domain.blum.codes/api/v1/time/now",
        userRequest: "https://user-domain.blum.codes/api/v1/user/me",
        balanceRequest: "https://game-domain.blum.codes/api/v1/user/balance",
        tasksRequest: "https://earn-domain.blum.codes/api/v1/tasks",
        dailyRewardRequest:
          "https://game-domain.blum.codes/api/v1/daily-reward",
        dogsDropEligibilityRequest:
          "https://game-domain.blum.codes/api/v2/game/eligibility/dogs_drop",
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
