import FarmerHeader from "@/components/FarmerHeader";
import { memo } from "react";

import TomarketIcon from "../assets/images/icon.png?format=webp&w=80";
import useTomarketInviteCodeQuery from "../hooks/useTomarketInviteCodeQuery";

export default memo(function TomarketFarmerHeader() {
  const query = useTomarketInviteCodeQuery();
  return (
    <FarmerHeader
      title={"Tomarket Farmer"}
      icon={TomarketIcon}
      referralLink={
        query.data
          ? `https://t.me/Tomarket_ai_bot/app?startapp=${query.data["invite_code"]}`
          : null
      }
    />
  );
});
