import FarmerDetect from "@/components/FarmerDetect";

import BitsIcon from "../assets/images/icon.png?format=webp&w=80";

export default function BitsAuthDetect({ status }) {
  return <FarmerDetect title={"Bits Farmer"} icon={BitsIcon} status={status} />;
}
