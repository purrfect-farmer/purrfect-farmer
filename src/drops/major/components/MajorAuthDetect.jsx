import FarmerDetect from "@/components/FarmerDetect";

import MajorIcon from "../assets/images/icon.png?format=webp&w=80";

export default function MajorAuthDetect({ status }) {
  return (
    <FarmerDetect title={"Major Farmer"} icon={MajorIcon} status={status} />
  );
}
