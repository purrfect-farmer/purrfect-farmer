import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import HrumIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function HrumAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Hrum Farmer"}
      icon={HrumIcon}
      status={status}
      className="text-purple-100"
    />
  );
});
