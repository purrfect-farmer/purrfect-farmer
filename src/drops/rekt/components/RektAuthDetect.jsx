import FarmerDetect from "@/components/FarmerDetect";

import RektIcon from "../assets/images/icon.png?format=webp&w=80";

export default function RektAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Rekt Farmer"}
      icon={RektIcon}
      status={status}
      className="text-blue-100"
    />
  );
}
