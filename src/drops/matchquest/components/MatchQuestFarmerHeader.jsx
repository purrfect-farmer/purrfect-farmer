import { memo } from "react";

import MatchQuestIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function MatchQuestFarmerHeader() {
  return (
    <div className="flex flex-col gap-1 py-4 border-b border-gray-500">
      <div className="flex items-center justify-center gap-2">
        <img
          src={MatchQuestIcon}
          alt="MatchQuest Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">MatchQuest Farmer</h1>
      </div>
    </div>
  );
});
