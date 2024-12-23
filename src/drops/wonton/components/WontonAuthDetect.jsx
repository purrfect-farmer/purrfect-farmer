import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import WontonIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function WontonAuthDetect({ status }) {
  return (
    <FarmerDetect title={"Wonton Farmer"} icon={WontonIcon} status={status} />
  );
});
