import FarmerDetect from "@/components/FarmerDetect";

import TruecoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function TruecoinAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Truecoin Farmer"}
      icon={TruecoinIcon}
      status={status}
    />
  );
}
