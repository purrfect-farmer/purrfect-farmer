import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn } from "@/lib/utils";
import { isAfter } from "date-fns";
import { useEffect } from "react";

import WontonAutoGamer from "./WontonAutoGamer";
import WontonAutoTasks from "./WontonAutoTasks";
import WontonBalanceDisplay from "./WontonBalanceDisplay";
import WontonFarmerHeader from "./WontonFarmerHeader";
import WontonUsernameDisplay from "./WontonUsernameDisplay";
import useWontonClaimFarmingMutation from "../hooks/useWontonClaimFarmingMutation";
import useWontonDailyCheckInMutation from "../hooks/useWontonDailyCheckInMutation";
import useWontonStartFarmingMutation from "../hooks/useWontonStartFarmingMutation";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function WontonFarmer() {
  const tabs = useSocketTabs("wonton.farmer-tabs", "game");
  const dailyCheckInMutation = useWontonDailyCheckInMutation();
  const startFarmingMutation = useWontonStartFarmingMutation();
  const claimFarmingMutation = useWontonClaimFarmingMutation();

  const { farmingStatusRequest } = useFarmerContext();

  useEffect(() => {
    (async function () {
      try {
        const data = await dailyCheckInMutation.mutateAsync();
        if (data.newCheckin) {
          toast.success("Wonton Daily Check-In");
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!farmingStatusRequest.data) {
      return;
    }

    (async function () {
      // Check
      const farming = farmingStatusRequest.data;

      if (!farming.finishAt || farming.claimed) {
        await startFarmingMutation.mutateAsync();
        toast.success("Wonton Started Farming");
      } else if (isAfter(new Date(), new Date(farming.finishAt))) {
        await claimFarmingMutation.mutateAsync();
        toast.success("Wonton Claimed Previous Farming");

        await startFarmingMutation.mutateAsync();
        toast.success("Wonton Started Farming");
      }
    })();
  }, [farmingStatusRequest.data]);

  return (
    <div className="flex flex-col p-4">
      <WontonFarmerHeader />
      <WontonUsernameDisplay />
      <WontonBalanceDisplay />

      <Tabs.Root {...tabs} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
          {["game", "tasks"].map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-2 border-transparent",
                "data-[state=active]:border-wonton-green-500"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="game">
          <WontonAutoGamer />
        </Tabs.Content>
        <Tabs.Content value="tasks">
          <WontonAutoTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
