import FarmerHeader from "@/components/FarmerHeader";
import { memo } from "react";

import BlumIcon from "../assets/images/icon.png?format=webp&w=80";
import useBlumFriendsBalanceQuery from "../hooks/useBlumFriendsBalanceQuery";

export default memo(function BlumFarmerHeader() {
  const query = useBlumFriendsBalanceQuery();

  return (
    <FarmerHeader
      title={"Blum Farmer"}
      icon={BlumIcon}
      referralLink={
        query.data
          ? `https://t.me/BlumCryptoBot/app?startapp=ref_${query.data["referralToken"]}`
          : null
      }
    />
  );
});
