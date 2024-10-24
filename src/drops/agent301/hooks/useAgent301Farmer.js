import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";

export default function useAgent301Farmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "agent301",
        host: "static.agent301.org",
        notification: {
          icon: Agent301Icon,
          title: "Agent301 Farmer",
        },
        domains: ["*.agent301.org"],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        tasksRequest: "https://api.agent301.org/getTasks",
        wheelRequest: "https://api.agent301.org/wheel/load",
        balanceRequest: "https://api.agent301.org/getMe",
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
