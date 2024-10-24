import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import { cn, delay } from "@/lib/utils";
import { isAfter } from "date-fns";
import { useEffect } from "react";

import BitsBalanceDisplay from "./BitsBalanceDisplay";
import BitsIcon from "../assets/images/icon.png?format=webp&w=80";
import BitsSocialTasks from "./BitsSocialTasks";
import useBitsClaimFreeSpinMutation from "../hooks/useBitsClaimFreeSpinMutation";
import useBitsClaimFreeTicketMutation from "../hooks/useBitsClaimFreeTicketMutation";
import useBitsCollectDailyRewardMutation from "../hooks/useBitsCollectDailyRewardMutation";
import useBitsCollectPassiveFarmingMutation from "../hooks/useBitsCollectPassiveFarmingMutation";
import useBitsDailyRewardQuery from "../hooks/useBitsDailyRewardQuery";
import useBitsFreeSpinQuery from "../hooks/useBitsFreeSpinQuery";
import useBitsFreeTicketQuery from "../hooks/useBitsFreeTicketQuery";
import useBitsStartPassiveFarmingMutation from "../hooks/useBitsStartPassiveFarmingMutation";
import useBitsUserQuery from "../hooks/useBitsUserQuery";

export default function BitsFarmer() {
  const userQuery = useBitsUserQuery();

  const freeSpinQuery = useBitsFreeSpinQuery();
  const claimFreeSpinMutation = useBitsClaimFreeSpinMutation();

  const freeTicketQuery = useBitsFreeTicketQuery();
  const claimFreeTicketMutation = useBitsClaimFreeTicketMutation();

  const dailyRewardQuery = useBitsDailyRewardQuery();
  const collectDailyRewardMutation = useBitsCollectDailyRewardMutation();

  const startPassiveFarmingMutation = useBitsStartPassiveFarmingMutation();
  const collectPassiveFarmingMutation = useBitsCollectPassiveFarmingMutation();

  /** Claim Passive Farming */
  useEffect(() => {
    if (!userQuery.data) return;

    (async function () {
      const passiveIncome = userQuery.data.passiveIncome;

      if (!passiveIncome.isStarted) {
        /** Delay */
        await delay(2000);

        /** Start Farming */
        await startPassiveFarmingMutation.mutateAsync();
        toast.success("Bits - Started Farming");
      } else if (passiveIncome.isComplete) {
        /** Claim Farming */
        await collectPassiveFarmingMutation.mutateAsync();
        toast.success("Bits - Collected Farming");

        /** Delay */
        await delay(2000);

        /** Start Farming */
        await startPassiveFarmingMutation.mutateAsync();
        toast.success("Bits - Started Farming");
      }
    })();
  }, [userQuery.data]);

  /** Claim Free Spins */
  useEffect(() => {
    if (!freeSpinQuery.data) return;

    (async function () {
      const data = freeSpinQuery.data;

      if (isAfter(new Date(), new Date(data.nextFreeSpinsAt))) {
        await delay(2000);
        await claimFreeSpinMutation.mutateAsync();
        toast.success("Bits - Claimed Free Spin");
      }
    })();
  }, [freeSpinQuery.data]);

  /** Claim Free Ticket */
  useEffect(() => {
    if (!freeTicketQuery.data) return;

    (async function () {
      const data = freeTicketQuery.data;

      if (isAfter(new Date(), new Date(data.nextFreeTicketsAt))) {
        await delay(2000);
        await claimFreeTicketMutation.mutateAsync();
        toast.success("Bits - Claimed Free Ticket");
      }
    })();
  }, [freeTicketQuery.data]);

  /** Claim Daily Reward */
  useEffect(() => {
    if (!dailyRewardQuery.data) return;

    (async function () {
      const data = dailyRewardQuery.data;
      const day = data.dailyRewards.find((item) => item.status === "Waiting");

      if (day) {
        await delay(2000);
        await collectDailyRewardMutation.mutateAsync(day.position);
        toast.success("Bits - Collected Daily Reward");
      }
    })();
  }, [dailyRewardQuery.data]);
  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img src={BitsIcon} alt="Bits Farmer" className="w-8 h-8" />
        <h1 className="font-bold">Bits Farmer</h1>
      </div>

      {/* Balance Display */}
      <BitsBalanceDisplay />

      <Tabs.Root defaultValue="tasks" className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-1">
          {["tasks"].map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-2 border-transparent",
                "data-[state=active]:border-white"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="tasks">
          <BitsSocialTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
