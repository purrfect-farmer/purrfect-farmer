import FarmerDetect from "@/components/FarmerDetect";

import DreamCoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function DreamCoinAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"DreamCoin Farmer"}
      icon={DreamCoinIcon}
      status={status}
    />
  );
}
