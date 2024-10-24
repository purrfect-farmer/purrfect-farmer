import useDropFarmer from "@/hooks/useDropFarmer";

import PumpadIcon from "../assets/images/icon.png?format=webp&w=80";

export default function usePumpadFarmer() {
  return useDropFarmer({
    id: "pumpad",
    host: "tg.pumpad.io",
    notification: {
      icon: PumpadIcon,
      title: "Pumpad Farmer",
    },
    domains: ["tg.pumpad.io"],
  });
}
