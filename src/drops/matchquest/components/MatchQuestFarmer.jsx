import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { Tabs } from "radix-ui";
import { cn, delay } from "@/lib/utils";
import { isAfter } from "date-fns";
import { memo } from "react";
import { useState } from "react";

import MatchQuestAutoGamer from "./MatchQuestAutoGamer";
import MatchQuestAutoTasks from "./MatchQuestAutoTasks";
import MatchQuestBalanceDisplay from "./MatchQuestBalanceDisplay";
import MatchQuestFarmerHeader from "./MatchQuestFarmerHeader";
import MatchQuestTicketsDisplay from "./MatchQuestTicketsDisplay";
import MatchQuestUsernameDisplay from "./MatchQuestUsernameDisplay";
import useMatchQuestClaimFarmingMutation from "../hooks/useMatchQuestClaimFarmingMutation";
import useMatchQuestDailyTaskQuery from "../hooks/useMatchQuestDailyTaskQuery";
import useMatchQuestPurchaseDailyTaskMutation from "../hooks/useMatchQuestPurchaseDailyTaskMutation";
import useMatchQuestRewardQuery from "../hooks/useMatchQuestRewardQuery";
import useMatchQuestStartFarmingMutation from "../hooks/useMatchQuestStartFarmingMutation";
import useMatchQuestUserQuery from "../hooks/useMatchQuestUserQuery";

export default memo(function MatchQuestFarmer() {
  const tabs = useMirroredTabs("matchquest.farmer-tabs", ["game", "tasks"]);

  const startFarmingMutation = useMatchQuestStartFarmingMutation();
  const claimFarmingMutation = useMatchQuestClaimFarmingMutation();
  const purchaseDailyTaskMutation = useMatchQuestPurchaseDailyTaskMutation();

  const rewardQuery = useMatchQuestRewardQuery();
  const dailyTaskQuery = useMatchQuestDailyTaskQuery();
  const userQuery = useMatchQuestUserQuery();

  /** Check Daily Boost Was Purchased */
  const [hasPurchasedDailyBoost, setHasPurchasedDailyBoost] = useState(false);

  /** Auto Start and Claim Farming */
  useFarmerAsyncTask(
    "farming",
    async function () {
      const data = rewardQuery.data;

      if (data["reward"] === 0) {
        /** Start Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("MatchQuest Started Farming");

        /** Refetch Query */
        await rewardQuery.refetch();
      } else if (isAfter(new Date(), new Date(data["next_claim_timestamp"]))) {
        /** Claim Farming */
        await claimFarmingMutation.mutateAsync();
        toast.success("MatchQuest Claimed Previous Farming");

        /** Start Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("MatchQuest Started Farming");

        /** Refetch Query */
        await rewardQuery.refetch();

        /** Allow Purchasing Daily Boost */
        setHasPurchasedDailyBoost(false);
      }
    },
    [rewardQuery.data]
  );

  /** Auto Purchase Daily Task */
  useFarmerAsyncTask(
    "daily-task-purchase",
    async function () {
      let initialBalance = userQuery.data["Balance"] / 1000;
      let balance = initialBalance;

      for (const task of dailyTaskQuery.data) {
        /** Prevent Purchase */
        if (task["type"] === "daily" && hasPurchasedDailyBoost) {
          continue;
        }

        for (let i = task["current_count"]; i < task["task_count"]; i++) {
          if (balance >= task["point"]) {
            try {
              /** Purchase */
              const isSuccess = await purchaseDailyTaskMutation.mutateAsync(
                task["type"]
              );

              if (!isSuccess) break;

              /** Update Balance */
              balance -= task["point"];

              /** Toast Message */
              toast.success("MatchQuest Purchased - " + task["name"]);

              /** Delay */
              await delay(1000);
            } catch {}
          }
        }

        /** Prevent Purchasing Again */
        if (task["type"] === "daily") {
          setHasPurchasedDailyBoost(true);
        }
      }

      if (balance !== initialBalance) {
        /** Refetch Daily Task Query */
        await dailyTaskQuery.refetch();

        /** Refetch User Query */
        await userQuery.refetch();
      }
    },
    [userQuery.data, dailyTaskQuery.data, hasPurchasedDailyBoost]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col p-4">
      <MatchQuestFarmerHeader />
      <MatchQuestUsernameDisplay />
      <MatchQuestBalanceDisplay />
      <MatchQuestTicketsDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b border-transparent",
                "data-[state=active]:border-orange-500"
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
          <MatchQuestAutoGamer />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <MatchQuestAutoTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
