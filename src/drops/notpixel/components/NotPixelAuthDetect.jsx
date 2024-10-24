import FarmerDetect from "@/components/FarmerDetect";

import NotPixelIcon from "../assets/images/icon.png?format=webp&w=80";

export default function NotPixelAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"NotPixel Farmer"}
      icon={NotPixelIcon}
      status={status}
    />
  );
}
