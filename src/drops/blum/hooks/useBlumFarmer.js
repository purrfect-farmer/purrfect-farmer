import useDropFarmer from "@/hooks/useDropFarmer";

import BlumIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useBlumFarmer() {
  return useDropFarmer({
    id: "blum",
    host: "telegram.blum.codes",
    notification: {
      icon: BlumIcon,
      title: "Blum Farmer",
    },
    domains: ["*.blum.codes"],
  });
}
