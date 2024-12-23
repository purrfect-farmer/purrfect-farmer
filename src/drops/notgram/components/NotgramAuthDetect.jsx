import FarmerDetect from "@/components/FarmerDetect";
import { memo } from "react";

import NotgramIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function NotgramAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Notgram Farmer"}
      icon={NotgramIcon}
      status={status}
      className="text-neutral-400"
    />
  );
});
