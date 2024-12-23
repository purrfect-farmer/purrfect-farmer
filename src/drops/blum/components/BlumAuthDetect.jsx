import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import BlumIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function BlumAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Blum Farmer"}
      icon={BlumIcon}
      status={status}
      className="text-neutral-400"
    />
  );
});
