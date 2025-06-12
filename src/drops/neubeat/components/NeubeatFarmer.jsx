import BasicFarmerInfo from "@/components/BasicFarmerInfo";
import FarmerHeader from "@/components/FarmerHeader";
import useFarmerContext from "@/hooks/useFarmerContext";
import { memo } from "react";

import NeubeatIcon from "../assets/images/icon.png?format=webp&w=80";
import useNeubeatUserQuery from "../hooks/useNeubeatUserQuery";

export default memo(function NeubeatFarmer() {
  const { telegramUser, joinTelegramLink } = useFarmerContext();
  const userQuery = useNeubeatUserQuery();

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <FarmerHeader
        title={"Neubeat Farmer"}
        icon={NeubeatIcon}
        referralLink={`https://t.me/NeubeatBot/beat?startapp=invite_${telegramUser.id}`}
      />

      <>
        <BasicFarmerInfo />
      </>
    </div>
  );
});
