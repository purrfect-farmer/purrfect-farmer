import FarmerDetect from "@/components/FarmerDetect";

import ZooIcon from "../assets/images/icon.png?format=webp&w=80";

export default function ZooAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Zoo Farmer"}
      icon={ZooIcon}
      status={status}
      className="text-purple-100"
    />
  );
}
