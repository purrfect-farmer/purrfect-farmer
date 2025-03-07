import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import PumpadIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function PumpadAuthDetect({ status }) {
  return (
    <FarmerDetect title={"Pumpad Farmer"} icon={PumpadIcon} status={status} />
  );
});
