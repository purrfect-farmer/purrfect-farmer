import FarmerDetect from "@/components/FarmerDetect";

import MatchQuestIcon from "../assets/images/icon.png?format=webp&w=80";

export default function MatchQuestAuthDetect({ status }) {
  return (
    <FarmerDetect
      title={"MatchQuest Farmer"}
      icon={MatchQuestIcon}
      status={status}
      className="text-gray-400"
    />
  );
}
