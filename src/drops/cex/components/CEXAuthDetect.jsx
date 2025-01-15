import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import CEXIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function CEXAuthDetect({ status }) {
  return <FarmerDetect title={"CEX Farmer"} icon={CEXIcon} status={status} />;
});
