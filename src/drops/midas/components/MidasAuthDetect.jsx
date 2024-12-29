import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import MidasIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function MidasAuthDetect({ status }) {
  return (
    <FarmerDetect title={"Midas Farmer"} icon={MidasIcon} status={status} />
  );
});
