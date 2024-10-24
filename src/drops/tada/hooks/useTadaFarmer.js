import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import TadaIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useTadaFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "tada",
        host: "tada-mini.mvlchain.io",
        notification: {
          icon: TadaIcon,
          title: "Tada Farmer",
        },
        domains: ["backend.clutchwalletserver.xyz"],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        missionsRequest:
          "https://backend.clutchwalletserver.xyz/activity/v3/missions?missionGroupId=eea00000-0000-4000-0000-000000000000&excludeAutoClaimable=true",
        passivePointRequest:
          "https://backend.clutchwalletserver.xyz/activity/v1/mission-point?missionPointId=REFERRAL_POINT_PASSIVE",
        activePointRequest:
          "https://backend.clutchwalletserver.xyz/activity/v1/mission-point?missionPointId=REFERRAL_POINT_ACTIVE",
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
