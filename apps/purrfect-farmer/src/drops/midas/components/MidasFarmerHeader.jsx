import FarmerHeader from "@/components/FarmerHeader";
import { memo } from "react";

import MidasIcon from "../assets/images/icon.png?format=webp&w=80";
import useMidasUserQuery from "../hooks/useMidasUserQuery";

export default memo(function MidasFarmerHeader() {
  const query = useMidasUserQuery();
  return (
    <FarmerHeader
      title={"Midas Farmer"}
      icon={MidasIcon}
      referralLink={
        query.data
          ? `https://t.me/MidasRWA_bot/app?startapp=ref_${query.data["referralCode"]}`
          : null
      }
    />
  );
});
