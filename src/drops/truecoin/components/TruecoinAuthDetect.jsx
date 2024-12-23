import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import TruecoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function TruecoinAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Truecoin Farmer"}
      icon={TruecoinIcon}
      status={status}
    />
  );
});
