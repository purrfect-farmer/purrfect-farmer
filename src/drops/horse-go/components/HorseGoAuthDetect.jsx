import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import HorseGoIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function HorseGoAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"HorseGo Farmer"}
      icon={HorseGoIcon}
      status={status}
      className="text-blue-100"
    />
  );
});
