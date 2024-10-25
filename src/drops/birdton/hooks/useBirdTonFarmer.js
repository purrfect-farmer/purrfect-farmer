import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import BirdTonIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useBirdTonFarmer() {
  const farmer = useDropFarmer({
    id: "birdton",
    host: "birdton.site",
    notification: {
      icon: BirdTonIcon,
      title: "BirdTon Farmer",
    },
    domains: [],
  });

  const userQuery = useQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: Boolean(farmer.auth),
    queryKey: ["birdton", "auth"],
    queryFn: () =>
      farmer.api
        .post("https://birdton.site/auth", farmer.telegramWebApp)
        .then((res) => res.data),
  });

  const user = userQuery?.data;

  return useMemo(
    () => ({
      ...farmer,
      user,
    }),
    [farmer, user]
  );
}
