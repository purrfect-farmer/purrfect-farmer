import FarmerDetect from "@/components/FarmerDetect";

import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";

export default function Agent301AuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Agent301 Farmer"}
      icon={Agent301Icon}
      status={status}
    />
  );
}
