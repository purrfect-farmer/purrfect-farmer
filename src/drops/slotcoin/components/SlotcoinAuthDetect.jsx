import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import SlotcoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function SlotcoinAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Slotcoin Farmer"}
      icon={SlotcoinIcon}
      status={status}
    />
  );
});
