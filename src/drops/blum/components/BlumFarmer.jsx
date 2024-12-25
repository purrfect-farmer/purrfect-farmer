import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn, delay } from "@/lib/utils";
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
  const tabs = useSocketTabs("blum.farmer-tabs", ["game", "tasks"]);
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
    () => {
      if (dailyRewardQuery.data) {
        const { claim } = dailyRewardQuery.data;

        if (claim === "available") {
          return async function () {
            /** Claim Daily Check-In */
            try {
              await claimDailyRewardMutation.mutateAsync();
              await dailyRewardQuery.refetch();

              /** Toast */
              toast.success("Blum - Daily Check-In");
            } catch {}
          };
        }
      }
    },
    [dailyRewardQuery.data]
  );

  /** Friends Reward */
  useFarmerAsyncTask(
    "friends-reward",
    () => {
      if (friendsBalanceQuery.data) {
        const amountForClaim = friendsBalanceQuery.data.amountForClaim;
        const canClaim = friendsBalanceQuery.data.canClaim;

        if (canClaim && amountForClaim > 0) {
          return async function () {
            try {
              /** Claim Friends Reward */
              await claimFriendsRewardMutation.mutateAsync();
              await friendsBalanceQuery.refetch();

              toast.success("Blum - Friends Reward");
            } catch {}
          };
        }
      }
    },
    [friendsBalanceQuery.data]
  );

  /** Start and Claim Farming */
  useFarmerAsyncTask(
    "farming",
    () => {
      if (balanceQuery.data) {
        const balance = balanceQuery.data;
        const farming = balance.farming;

        if (!balance.isFastFarmingEnabled) {
          return async function () {
            /** Start New Farming */
            await startFarmingMutation.mutateAsync();
            await balanceQuery.refetch();

            /** Toast */
            toast.success("Blum - Started Farming");
          };
        } else if (farming && balance.timestamp >= farming.endTime) {
          return async function () {
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
          };
        }
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

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b border-transparent",
                "data-[state=active]:border-blum-green-500"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="game"
        >
          <BlumGamer />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <BlumAutoTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
