import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { customLogger } from "@/lib/utils";
import { memo } from "react";

import UnijumpFarmerHeader from "./UnijumpFarmerHeader";
import useUnijumpClaimDailyRewardMutation from "../hooks/useUnijumpClaimDailyRewardMutation";
import useUnijumpClaimFarmingMutation from "../hooks/useUnijumpClaimFarmingMutation";
import useUnijumpClaimLeagueMutation from "../hooks/useUnijumpClaimLeagueMutation";
import useUnijumpGetFreeLootboxMutation from "../hooks/useUnijumpGetFreeLootboxMutation";
import useUnijumpOpenLootboxMutation from "../hooks/useUnijumpOpenLootboxMutation";
import useUnijumpPlayerStateQuery from "../hooks/useUnijumpPlayerStateQuery";
import useUnijumpStartFarmingMutation from "../hooks/useUnijumpStartFarmingMutation";
import useUnijumpUtcQuery from "../hooks/useUnijumpUtcQuery";

export default memo(function UnijumpFarmer() {
  const utcQuery = useUnijumpUtcQuery();
  const playerStateQuery = useUnijumpPlayerStateQuery();
  const claimDailyRewardMutation = useUnijumpClaimDailyRewardMutation();
  const claimLeagueMutation = useUnijumpClaimLeagueMutation();
  const startFarmingMutation = useUnijumpStartFarmingMutation();
  const claimFarmingMutation = useUnijumpClaimFarmingMutation();

  const getFreeLootboxMutation = useUnijumpGetFreeLootboxMutation();
  const openLootboxMutation = useUnijumpOpenLootboxMutation();

  /** Farming */
  useFarmerAsyncTask(
    "farming",
    async () => {
      const { leagueLevel, farming } = playerStateQuery.data;
      const { utc } = utcQuery.data;

      /** From LVL 3 */
      if (leagueLevel < 3) return;

      if (!farming) {
        /** Start Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("Unijump - Started Farming");

        /** Refresh */
        await playerStateQuery.refetch();
      } else if (farming.endsAt && farming.endsAt < utc) {
        /** Claim Previous Farming */
        await claimFarmingMutation.mutateAsync();
        toast.success("Unijump - Claimed Previous Farming");

        /** Start Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("Unijump - Started Farming");

        /** Refresh */
        await playerStateQuery.refetch();
      }
    },
    [utcQuery.data, playerStateQuery.data]
  );

  /** Claim Leagues */
  useFarmerAsyncTask(
    "claim-leagues",
    async () => {
      const { leaguesToClaim } = playerStateQuery.data;

      if (leaguesToClaim && leaguesToClaim.length > 0) {
        /** Log */
        customLogger("UNIJUMP LEAGUES TO CLAIM", leaguesToClaim);

        for (const league of leaguesToClaim) {
          await claimLeagueMutation.mutateAsync(league);
        }

        /** Refresh */
        await playerStateQuery.refetch();
      }
    },
    [playerStateQuery.data]
  );

  /** Lootbox */
  useFarmerAsyncTask(
    "lootbox",
    async () => {
      const { utc } = utcQuery.data;
      const { lootboxesInfo } = playerStateQuery.data;
      const { freeAvailableAt, availableLootboxes } = lootboxesInfo;

      /** Get Free Lootbox */
      if (freeAvailableAt < utc) {
        await getFreeLootboxMutation.mutateAsync();
      }

      /** Open Lootbox */
      for (const [type, count] of Object.entries(availableLootboxes)) {
        for (let i = 0; i < count; i++) {
          await openLootboxMutation.mutateAsync(type);
        }
      }
    },
    [utcQuery.data, playerStateQuery.data]
  );

  /** Claim Daily Reward */
  useFarmerAsyncTask(
    "daily-reward",
    async () => {
      const { dailyRewards } = playerStateQuery.data;

      if (!dailyRewards) return;

      const { currentDay, milestones, rewards } = dailyRewards;
      const currentMilestone = milestones.find(
        (item) => item.day === currentDay
      );
      const currentReward = rewards.find((item) => item.day === currentDay);

      /** Log */
      customLogger(
        "UNIJUMP DAILY-REWARD",
        dailyRewards,
        currentReward,
        currentMilestone
      );

      if (currentReward && !currentReward.claimed) {
        await claimDailyRewardMutation();
      }
    },
    [playerStateQuery.data]
  );
  return (
    <div className="flex flex-col p-4">
      <UnijumpFarmerHeader />
    </div>
  );
});
