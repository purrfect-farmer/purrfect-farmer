import { Tabs } from "radix-ui";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";
import { memo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import BattleBullsCards from "./BattleBullsCards";
import BattleBullsIcon from "../assets/images/icon.png?format=webp&w=80";
import BattleBullsInfoDisplay from "./BattleBullsInfoDisplay";
import BattleBullsTasks from "./BattleBullsTasks";
import useBattleBullsBlockchainMutation from "../hooks/useBattleBullsBlockchainMutation";
import useBattleBullsClaimDailyRewardMutation from "../hooks/useBattleBullsClaimDailyRewardMutation";
import useBattleBullsTasksQuery from "../hooks/useBattleBullsTasksQuery";
import useBattleBullsUserQuery from "../hooks/useBattleBullsUserQuery";

export default memo(function BattleBullsFarmer() {
  const tabs = useMirroredTabs("battle-bulls.farmer-tabs", ["cards", "tasks"]);
  const queryClient = useQueryClient();
  const userQuery = useBattleBullsUserQuery();
  const tasksQuery = useBattleBullsTasksQuery();

  const claimDailyRewardMutation = useBattleBullsClaimDailyRewardMutation();
  const blockchainMutation = useBattleBullsBlockchainMutation();

  /** Auto Claim Daily Reward */
  useFarmerAsyncTask(
    "daily-reward",
    () => {
      if ([userQuery.data, tasksQuery.data].every(Boolean))
        return async function () {
          const dailyTasks = tasksQuery.data.find(
            (item) => item.id === "streak_days"
          );
          const completedAt = dailyTasks.completedAt;

          if (completedAt === null || !isToday(new Date(completedAt))) {
            const result = await claimDailyRewardMutation.mutateAsync();

            const user = result.user;
            const {
              taskId,
              competedAt: completedAt,
              ...taskUpdate
            } = result.completedTask;

            /** Update User */
            queryClient.setQueryData(["battle-bulls", "user"], (prev) => ({
              ...prev,
              ...user,
            }));

            /** Update Tasks */
            queryClient.setQueryData(["battle-bulls", "tasks"], (prev) =>
              prev.map((item) =>
                item.id === taskId
                  ? { ...item, ...taskUpdate, completedAt }
                  : item
              )
            );

            /** Toast */
            toast.success("BattleBulls - Daily Reward");
          }
        };
    },
    [userQuery.data, tasksQuery.data]
  );

  /** Choose Blockchain */
  useFarmerAsyncTask(
    "choose-blockchain",
    () => {
      if (userQuery.data)
        return async function () {
          const blockchainId = userQuery.data.blockchainId;

          if (blockchainId === null) {
            const result = await blockchainMutation.mutateAsync("bitcoin");

            /** Update User */
            queryClient.setQueryData(["battle-bulls", "user"], (prev) => ({
              ...prev,
              ...result,
            }));

            /** Toast */
            toast.success("BattleBulls - Selected Blockchain");
          }
        };
    },
    [userQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={BattleBullsIcon}
          alt="BattleBulls Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">BattleBulls Farmer</h1>
      </div>

      {/* Info */}
      <BattleBullsInfoDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col">
        <Tabs.List className="grid grid-cols-2">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-blue-500"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Cards */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="cards"
        >
          <BattleBullsCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <BattleBullsTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
