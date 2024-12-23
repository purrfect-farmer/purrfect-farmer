import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import ZooIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function ZooAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Zoo Farmer"}
      icon={ZooIcon}
      status={status}
      className="text-purple-100"
    />
  );
});
