import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import PumpadIcon from "../assets/images/icon.png?format=webp&w=80";

export default function usePumpadFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "pumpad",
        host: "tg.pumpad.io",
        notification: {
          icon: PumpadIcon,
          title: "Pumpad Farmer",
        },
        domains: ["tg.pumpad.io"],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        userRequest: "https://tg.pumpad.io/referral/api/v1/tg/user/information",
        lotteryRequest: "https://tg.pumpad.io/referral/api/v1/lottery",
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
