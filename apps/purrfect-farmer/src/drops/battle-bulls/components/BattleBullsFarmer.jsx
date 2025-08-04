import FarmerHeader from "@/components/FarmerHeader";
import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredTabs from "@/hooks/useMirroredTabs";
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
  const { telegramUser } = useFarmerContext();
  const tabs = useMirroredTabs("battle-bulls.farmer-tabs", ["cards", "tasks"]);
  const queryClient = useQueryClient();
  const userQuery = useBattleBullsUserQuery();
  const tasksQuery = useBattleBullsTasksQuery();

  const claimDailyRewardMutation = useBattleBullsClaimDailyRewardMutation();
  const blockchainMutation = useBattleBullsBlockchainMutation();

  /** Auto Claim Daily Reward */
  useFarmerAsyncTask(
    "daily-reward",
    async function () {
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
            item.id === taskId ? { ...item, ...taskUpdate, completedAt } : item
          )
        );

        /** Toast */
        toast.success("BattleBulls - Daily Reward");
      }
    },
    [userQuery.data, tasksQuery.data]
  );

  /** Choose Blockchain */
  useFarmerAsyncTask(
    "choose-blockchain",
    async function () {
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
    },
    [userQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <FarmerHeader
        title={"BattleBulls Farmer"}
        icon={BattleBullsIcon}
        referralLink={`https://t.me/battle_games_com_bot/start?startapp=frndId${telegramUser["id"]}`}
      />

      {/* Info */}
      <BattleBullsInfoDisplay />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"data-[state=active]:border-blue-500"}
      >
        {/* Cards */}
        <Tabs.Content value="cards">
          <BattleBullsCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content value="tasks">
          <BattleBullsTasks />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
