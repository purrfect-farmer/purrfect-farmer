import FarmerHeader from "@/components/FarmerHeader";
import { memo } from "react";

import HorseGoIcon from "../assets/images/icon.png?format=webp&w=80";
import useHorseGoUserQuery from "../hooks/useHorseGoUserQuery";

export default memo(function HorseGoFarmerHeader() {
  const query = useHorseGoUserQuery();
  return (
    <FarmerHeader
      title={"HorseGo Farmer"}
      icon={HorseGoIcon}
      referralLink={
        query.data
          ? `https://t.me/HorseGo_bot/HorseFever?startapp=code_${query.data["inviteCode"]}`
          : null
      }
    />
  );
});
