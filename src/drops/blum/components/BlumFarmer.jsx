import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn, delay } from "@/lib/utils";
import { useEffect } from "react";

import BlumAutoTasks from "./BlumAutoTasks";
import BlumBalanceDisplay from "./BlumBalanceDisplay";
import BlumFarmerHeader from "./BlumFarmerHeader";
import BlumGamer from "./BlumGamer";
import BlumUsernameDisplay from "./BlumUsernameDisplay";
import useBlumBalanceQuery from "../hooks/useBlumBalanceQuery";
import useBlumClaimDailyRewardMutation from "../hooks/useBlumClaimDailyRewardMutation";
import useBlumClaimFarmingMutation from "../hooks/useBlumClaimFarmingMutation";
import useBlumDailyRewardQuery from "../hooks/useBlumDailyRewardQuery";
import useBlumStartFarmingMutation from "../hooks/useBlumStartFarmingMutation";
import useBlumFriendsBalanceQuery from "../hooks/useBlumFriendsBalanceQuery";
import useBlumClaimFriendsRewardMutation from "../hooks/useBlumClaimFriendsRewardMutation";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";

export default function BlumFarmer() {
  const tabs = useSocketTabs("blum.farmer-tabs", "game");
  const balanceQuery = useBlumBalanceQuery();

  const dailyRewardQuery = useBlumDailyRewardQuery();
  const claimDailyRewardMutation = useBlumClaimDailyRewardMutation();

  const startFarmingMutation = useBlumStartFarmingMutation();
  const claimFarmingMutation = useBlumClaimFarmingMutation();

  const friendsBalanceQuery = useBlumFriendsBalanceQuery();
  const claimFriendsRewardMutation = useBlumClaimFriendsRewardMutation();

  /** Daily Reward */
  useEffect(() => {
    if (!dailyRewardQuery.data) return;
    (async function () {
      try {
        await claimDailyRewardMutation.mutateAsync();
        toast.success("Blum - Daily Check-In");
      } catch {}
    })();
  }, [dailyRewardQuery.data]);

  /** Friends Reward */
  useEffect(() => {
    if (!friendsBalanceQuery.data) return;
    (async function () {
      try {
        const amountForClaim = friendsBalanceQuery.data.amountForClaim;
        const canClaim = friendsBalanceQuery.data.canClaim;

        if (canClaim && amountForClaim > 0) {
          await claimFriendsRewardMutation.mutateAsync();
          toast.success("Blum - Friends Reward");
        }
      } catch {}
    })();
  }, [friendsBalanceQuery.data]);

  /** Start and Claim Farming */
  useEffect(() => {
    if (!balanceQuery.data) {
      return;
    }

    (async function () {
      const balance = balanceQuery.data;
      const farming = balance.farming;

      if (!balance.isFastFarmingEnabled) {
        /** Start New Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("Blum - Started Farming");
      } else if (farming && balance.timestamp >= farming.endTime) {
        /** Claim Previous Farming */
        await claimFarmingMutation.mutateAsync();
        toast.success("Blum - Claimed Previous Farming");

        /** Delay */
        await delay(1000);

        /** Start New Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("Blum - Started Farming");
      }
    })();
  }, [balanceQuery.data]);

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs.onValueChange);

  return (
    <div className="flex flex-col p-4">
      <BlumFarmerHeader />
      <BlumUsernameDisplay />
      <BlumBalanceDisplay />

      <Tabs.Root {...tabs} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
          {["game", "tasks"].map((value, index) => (
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
}
