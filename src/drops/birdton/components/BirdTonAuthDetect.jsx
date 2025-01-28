import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import BirdTonIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function BirdTonAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"BirdTon Farmer"}
      icon={BirdTonIcon}
      status={status}
      className="text-sky-100"
    />
  );
});
