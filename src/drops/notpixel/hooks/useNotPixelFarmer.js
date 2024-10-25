import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import NotPixelIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useNotPixelFarmer() {
  const farmer = useDropFarmer({
    id: "notpixel",
    host: "app.notpx.app",
    notification: {
      icon: NotPixelIcon,
      title: "NotPixel Farmer",
    },
    domains: ["notpx.app"],
  });

  const userQuery = useQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: Boolean(farmer.auth),
    queryKey: ["notpixel", "user"],
    queryFn: () =>
      farmer.api
        .get("https://notpx.app/api/v1/users/me")
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
