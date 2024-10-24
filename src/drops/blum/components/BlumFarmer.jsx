import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn, delay } from "@/lib/utils";
import { useEffect } from "react";

import BlumAutoTasks from "./BlumAutoTasks";
import BlumBalanceDisplay from "./BlumBalanceDisplay";
import BlumFarmerHeader from "./BlumFarmerHeader";
import BlumUsernameDisplay from "./BlumUsernameDisplay";
import useBlumClaimDailyRewardMutation from "../hooks/useBlumClaimDailyRewardMutation";
import useBlumClaimFarmingMutation from "../hooks/useBlumClaimFarmingMutation";
import useBlumStartFarmingMutation from "../hooks/useBlumStartFarmingMutation";
import BlumGamer from "./BlumGamer";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function BlumFarmer() {
  const tabs = useSocketTabs("blum.farmer-tabs", "game");
  const { balanceRequest, dailyRewardRequest } = useFarmerContext();

  const claimDailyRewardMutation = useBlumClaimDailyRewardMutation();

  const startFarmingMutation = useBlumStartFarmingMutation();
  const claimFarmingMutation = useBlumClaimFarmingMutation();

  /** Daily Reward */
  useEffect(() => {
    if (!dailyRewardRequest.data) return;
    (async function () {
      try {
        await delay(2000);
        await claimDailyRewardMutation.mutateAsync();
        toast.success("Blum Daily Check-In");
      } catch {}
    })();
  }, [dailyRewardRequest.data]);

  /** Start and Claim Farming */
  useEffect(() => {
    if (!balanceRequest.data) {
      return;
    }

    (async function () {
      const { timestamp, farming, isFastFarmingEnabled } = balanceRequest.data;

      if (!isFastFarmingEnabled) {
        /** Delay */
        await delay(2000);
        await startFarmingMutation.mutateAsync();
        toast.success("Blum Started Farming");
      } else if (farming && farming.endTime <= timestamp) {
        await claimFarmingMutation.mutateAsync();
        toast.success("Blum Claimed Previous Farming");

        /** Delay */
        await delay(2000);
        await startFarmingMutation.mutateAsync();
        toast.success("Blum Started Farming");
      }
    })();
  }, [balanceRequest.data]);

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
        <Tabs.Content value="game">
          <BlumGamer />
        </Tabs.Content>
        <Tabs.Content value="tasks">
          <BlumAutoTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
