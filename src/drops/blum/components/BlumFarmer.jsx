import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { delay } from "@/lib/utils";
import { memo } from "react";
import BlumAutoTasks from "./BlumAutoTasks";
import BlumBalanceDisplay from "./BlumBalanceDisplay";
import BlumFarmerHeader from "./BlumFarmerHeader";
import BlumGamer from "./BlumGamer";
import BlumUsernameDisplay from "./BlumUsernameDisplay";
import useBlumBalanceQuery from "../hooks/useBlumBalanceQuery";
import useBlumClaimDailyRewardMutation from "../hooks/useBlumClaimDailyRewardMutation";
import useBlumClaimFarmingMutation from "../hooks/useBlumClaimFarmingMutation";
import useBlumClaimFriendsRewardMutation from "../hooks/useBlumClaimFriendsRewardMutation";
import useBlumDailyRewardQuery from "../hooks/useBlumDailyRewardQuery";
import useBlumFriendsBalanceQuery from "../hooks/useBlumFriendsBalanceQuery";
import useBlumStartFarmingMutation from "../hooks/useBlumStartFarmingMutation";

export default memo(function BlumFarmer() {
  const tabs = useMirroredTabs("blum.farmer-tabs", ["game", "tasks"]);
  const balanceQuery = useBlumBalanceQuery();

  const dailyRewardQuery = useBlumDailyRewardQuery();
  const claimDailyRewardMutation = useBlumClaimDailyRewardMutation();

  const startFarmingMutation = useBlumStartFarmingMutation();
  const claimFarmingMutation = useBlumClaimFarmingMutation();

  const friendsBalanceQuery = useBlumFriendsBalanceQuery();
  const claimFriendsRewardMutation = useBlumClaimFriendsRewardMutation();

  /** Daily Reward */
  useFarmerAsyncTask(
    "daily-check-in",
    async function () {
      const { claim } = dailyRewardQuery.data;

      /** Claim Daily Check-In */
      if (claim === "available") {
        try {
          await claimDailyRewardMutation.mutateAsync();
          toast.success("Blum - Daily Check-In");
        } catch {}
      }
    },
    [dailyRewardQuery.data]
  );

  /** Friends Reward */
  useFarmerAsyncTask(
    "friends-reward",
    async function () {
      try {
        const amountForClaim = friendsBalanceQuery.data.amountForClaim;
        const canClaim = friendsBalanceQuery.data.canClaim;

        if (canClaim && amountForClaim > 0) {
          /** Claim Friends Reward */
          await claimFriendsRewardMutation.mutateAsync();
          toast.success("Blum - Friends Reward");

          /** Refetch */
          await friendsBalanceQuery.refetch();
        }
      } catch {}
    },
    [friendsBalanceQuery.data]
  );

  /** Start and Claim Farming */
  useFarmerAsyncTask(
    "farming",
    async function () {
      const balance = balanceQuery.data;
      const farming = balance.farming;

      if (!balance.isFastFarmingEnabled) {
        /** Start New Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("Blum - Started Farming");

        /** Refetch */
        await balanceQuery.refetch();
      } else if (farming && balance.timestamp >= farming.endTime) {
        /** Claim Previous Farming */
        await claimFarmingMutation.mutateAsync();
        toast.success("Blum - Claimed Previous Farming");

        /** Delay */
        await delay(1000);

        /** Start New Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("Blum - Started Farming");

        /** Refetch */
        await balanceQuery.refetch();
      }
    },
    [balanceQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col p-4">
      <BlumFarmerHeader />
      <BlumUsernameDisplay />
      <BlumBalanceDisplay />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-4"}
        triggerClassName={"data-[state=active]:border-blum-green-500"}
      >
        <Tabs.Content value="game">
          <BlumGamer />
        </Tabs.Content>
        <Tabs.Content value="tasks">
          <BlumAutoTasks />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
