import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import DreamCoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function DreamCoinAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"DreamCoin Farmer"}
      icon={DreamCoinIcon}
      status={status}
    />
  );
});
