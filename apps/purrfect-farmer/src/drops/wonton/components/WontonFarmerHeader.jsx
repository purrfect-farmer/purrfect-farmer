import FarmerHeader from "@/components/FarmerHeader";
import { memo } from "react";

import WontonIcon from "../assets/images/icon.png?format=webp&w=80";
import useWontonUserQuery from "../hooks/useWontonUserQuery";

export default memo(function WontonFarmerHeader() {
  const query = useWontonUserQuery();
  return (
    <FarmerHeader
      title={"Wonton Farmer"}
      icon={WontonIcon}
      referralLink={
        query.data
          ? `https://t.me/WontonOrgBot/gameapp?startapp=referralCode=${query.data["inviteCode"]}`
          : null
      }
    />
  );
});
