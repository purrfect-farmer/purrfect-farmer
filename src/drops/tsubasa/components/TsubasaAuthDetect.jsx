import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import TsubasaIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function TsubasaAuthDetect({ status }) {
  return (
    <FarmerDetect title={"Tsubasa Farmer"} icon={TsubasaIcon} status={status} />
  );
});
