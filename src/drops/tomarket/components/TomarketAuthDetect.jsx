import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import TomarketIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function TomarketAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Tomarket Farmer"}
      icon={TomarketIcon}
      status={status}
      className="text-rose-100"
    />
  );
});
