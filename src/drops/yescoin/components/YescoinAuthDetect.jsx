import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import YescoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function YescoinAuthDetect({ status }) {
  return (
    <FarmerDetect title={"Yescoin Farmer"} icon={YescoinIcon} status={status} />
  );
});
