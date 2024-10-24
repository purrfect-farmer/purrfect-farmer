import useDropFarmer from "@/hooks/useDropFarmer";

import MajorIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useMajorFarmer() {
  return useDropFarmer({
    id: "major",
    host: "major.bot",
    notification: {
      icon: MajorIcon,
      title: "Major Farmer",
    },
    domains: ["major.bot"],
  });
}
