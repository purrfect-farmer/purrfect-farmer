import FarmerHeader from "@/components/FarmerHeader";
import useFarmerContext from "@/hooks/useFarmerContext";
import { memo } from "react";

import VoxelIcon from "../assets/images/icon.png?format=webp&w=80";
import VoxelMissions from "./VoxelMissions";
import useVoxelComboLimitQuery from "../hooks/useVoxelComboLimitQuery";
import useVoxelInventoryQuery from "../hooks/useVoxelInventoryQuery";
import useVoxelUserQuery from "../hooks/useVoxelUserQuery";

export default memo(function VoxelFarmer() {
  const { joinTelegramLink, telegramUser } = useFarmerContext();
  const userQuery = useVoxelUserQuery();
  const inventoryQuery = useVoxelInventoryQuery();
  const comboLimitQuery = useVoxelComboLimitQuery();

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <FarmerHeader
        title={"Voxel Farmer"}
        icon={VoxelIcon}
        referralLink={
          telegramUser
            ? `https://t.me/voxel_verse_bot/app?startapp${telegramUser.id}`
            : null
        }
      />

      <>
        <VoxelMissions />
      </>
    </div>
  );
});
