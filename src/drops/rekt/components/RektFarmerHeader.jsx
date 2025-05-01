import FarmerHeader from "@/components/FarmerHeader";
import { memo } from "react";

import RektIcon from "../assets/images/icon.png?format=webp&w=80";
import useRektReferralCodeQuery from "../hooks/useRektReferralCodeQuery";

export default memo(function RektFarmerHeader() {
  const query = useRektReferralCodeQuery();
  return (
    <FarmerHeader
      title={"Rekt Farmer"}
      icon={RektIcon}
      referralLink={
        query.data
          ? `https://t.me/rektme_bot/rektapp?startapp=${query.data}`
          : null
      }
    />
  );
});
