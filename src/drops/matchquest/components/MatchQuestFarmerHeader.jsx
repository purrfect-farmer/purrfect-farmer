import FarmerHeader from "@/components/FarmerHeader";
import { memo } from "react";

import MatchQuestIcon from "../assets/images/icon.png?format=webp&w=80";
import useMatchQuestUserQuery from "../hooks/useMatchQuestUserQuery";

export default memo(function MatchQuestFarmerHeader() {
  const query = useMatchQuestUserQuery();

  return (
    <FarmerHeader
      title={"MatchQuest Farmer"}
      icon={MatchQuestIcon}
      referralLink={
        query.data
          ? `https://t.me/MatchQuestBot/start?startapp=${query.data["InviteCode"]}`
          : null
      }
    />
  );
});
