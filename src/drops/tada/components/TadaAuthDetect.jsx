import FarmerDetect from "@/components/FarmerDetect";

import TadaIcon from "../assets/images/icon.png?format=webp&w=80";

export default function TadaAuthDetect({ status }) {
  return <FarmerDetect title={"Tada Farmer"} icon={TadaIcon} status={status} />;
}
