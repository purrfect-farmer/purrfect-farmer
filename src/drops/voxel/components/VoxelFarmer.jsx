import FarmerHeader from "@/components/FarmerHeader";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerContext from "@/hooks/useFarmerContext";
import { memo } from "react";

import VoxelIcon from "../assets/images/icon.png?format=webp&w=80";
import VoxelMissions from "./VoxelMissions";
import useVoxelClaimAllInventoryMutation from "../hooks/useVoxelClaimAllInventoryMutation";
import useVoxelInventoryQuery from "../hooks/useVoxelInventoryQuery";

export default memo(function VoxelFarmer() {
  const { telegramUser } = useFarmerContext();
  const inventoryQuery = useVoxelInventoryQuery();
  const claimAllInventoryMutation = useVoxelClaimAllInventoryMutation();

  /** Claim All Inventory */
  useFarmerAsyncTask(
    "claim-all-inventory",
    async () => {
      const inventory = inventoryQuery.data;
      const canClaim = inventory.some(
        (item) => item.farming && item.timeToClaim === 0
      );

      if (canClaim) {
        await claimAllInventoryMutation.mutateAsync();
        toast.success("Voxel - Claimed Inventory");
      }
    },
    [inventoryQuery.data]
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <FarmerHeader
        title={"Voxel Farmer"}
        icon={VoxelIcon}
        referralLink={
          telegramUser
            ? `https://t.me/voxel_verse_bot/app?startapp=${telegramUser.id}`
            : null
        }
      />

      <>
        <VoxelMissions />
      </>
    </div>
  );
});
