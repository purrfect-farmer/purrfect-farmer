import FarmerHeader from "@/components/FarmerHeader";
import { memo } from "react";

import UnijumpIcon from "../assets/images/icon.png?format=webp&w=80";
import useUnijumpPlayerStateQuery from "../hooks/useUnijumpPlayerStateQuery";

export default memo(function MoneyBuxFarmerHeader() {
  const query = useUnijumpPlayerStateQuery();
  return (
    <FarmerHeader
      title={"Unijump Farmer"}
      icon={UnijumpIcon}
      referralLink={
        query.data?.["reflink"]
          ? `https://t.me/unijump_bot/game?startapp=ref${query.data["reflink"]}`
          : null
      }
    />
  );
});
