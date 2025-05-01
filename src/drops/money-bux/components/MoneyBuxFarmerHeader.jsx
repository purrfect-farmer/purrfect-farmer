import FarmerHeader from "@/components/FarmerHeader";
import useFarmerContext from "@/hooks/useFarmerContext";
import { memo } from "react";

import MoneyBuxIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function MoneyBuxFarmerHeader() {
  const { telegramUser } = useFarmerContext();
  return (
    <FarmerHeader
      title={"Money Bux Farmer"}
      icon={MoneyBuxIcon}
      referralLink={`https://t.me/moneybux_bot/app?startapp=r_${telegramUser["id"]}`}
    />
  );
});
