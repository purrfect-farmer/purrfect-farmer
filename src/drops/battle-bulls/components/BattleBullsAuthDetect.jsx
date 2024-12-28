import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import BattleBullsIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function BattleBullsAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"BattleBulls Farmer"}
      icon={BattleBullsIcon}
      status={status}
    />
  );
});
