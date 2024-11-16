import FarmerDetect from "@/components/FarmerDetect";

import NotgramIcon from "../assets/images/icon.png?format=webp&w=80";

export default function NotgramAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"Notgram Farmer"}
      icon={NotgramIcon}
      status={status}
      className="text-gray-400"
    />
  );
}
