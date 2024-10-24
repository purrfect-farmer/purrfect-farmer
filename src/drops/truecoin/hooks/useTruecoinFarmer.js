import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import TruecoinIcon from "../assets/images/icon.png?format=webp&w=80";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

export default function useTruecoinFarmer() {
  const farmer = useDropFarmer({
    id: "truecoin",
    host: "bot.true.world",
    notification: {
      icon: TruecoinIcon,
      title: "Truecoin Farmer",
    },
    domains: ["*.true.world"],
  });

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        userRequest: "https://api.true.world/api/auth/signIn",
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
