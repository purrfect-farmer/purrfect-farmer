import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import FunaticIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function FunaticAuthDetect({ status }) {
  return (
    <FarmerDetect title={"Funatic Farmer"} icon={FunaticIcon} status={status} />
  );
});
