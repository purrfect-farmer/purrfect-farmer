import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import GoldEagleIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function GoldEagleAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"GoldEagle Farmer"}
      icon={GoldEagleIcon}
      status={status}
    />
  );
});
