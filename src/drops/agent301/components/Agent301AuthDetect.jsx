import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function Agent301AuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Agent301 Farmer"}
      icon={Agent301Icon}
      status={status}
    />
  );
});
