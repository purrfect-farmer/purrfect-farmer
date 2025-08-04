import FarmerHeader from "@/components/FarmerHeader";
import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useState } from "react";

import DreamCoinIcon from "../assets/images/icon.png?format=webp&w=80";
import DreamCoinInfoDisplay from "./DreamCoinInfoDisplay";
import DreamCoinLottery from "./DreamCoinLottery";
import DreamCoinRewards from "./DreamCoinRewards";
import useDreamCoinClaimDailyTaskMutation from "../hooks/useDreamCoinClaimDailyTaskMutation";
import useDreamCoinCollectClickerRewardMutation from "../hooks/useDreamCoinCollectClickerRewardMutation";
import useDreamCoinDailyTasksQuery from "../hooks/useDreamCoinDailyTasksQuery";
import useDreamCoinGetCaseMutation from "../hooks/useDreamCoinGetCaseMutation";
import useDreamCoinOpenCaseMutation from "../hooks/useDreamCoinOpenCaseMutation";
import useDreamCoinUpgradeAllLevelMutation from "../hooks/useDreamCoinUpgradeAllLevelMutation";
import useDreamCoinUserQuery from "../hooks/useDreamCoinUserQuery";

export default memo(function DreamCoinFarmer() {
  const { telegramUser } = useFarmerContext();
  const tabs = useMirroredTabs("dreamcoin.farmer-tabs", ["lottery", "rewards"]);

  const userQuery = useDreamCoinUserQuery();
  const dailyTasksQuery = useDreamCoinDailyTasksQuery();
  const claimDailyTaskMutation = useDreamCoinClaimDailyTaskMutation();
  const collectClickerRewardMutation =
    useDreamCoinCollectClickerRewardMutation();
  const upgradeAllLevelMutation = useDreamCoinUpgradeAllLevelMutation();
  const getCaseMutation = useDreamCoinGetCaseMutation();
  const openCaseMutation = useDreamCoinOpenCaseMutation();

  const [hasCollectedClickerReward, setHasCollectedClickerReward] =
    useState(false);

  /** Auto Claim Daily Reward */
  useFarmerAsyncTask(
    "daily-reward",
    async function () {
      const today = new Date().toISOString().split("T")[0];
      const dailyTasks = dailyTasksQuery.data.dailyTasks;
      const day = dailyTasks.find(
        (item) => item.date === today && !item.isClaimed
      );

      /** Log It */
      customLogger("DREAMCOIN TODAY", today);
      customLogger("DREAMCOIN DAILY-TASKS", dailyTasks);
      customLogger("DREAMCOIN DAY", day);

      if (day) {
        /** Claim */
        await claimDailyTaskMutation.mutateAsync(day.id);

        /** Toast */
        toast.success("DreamCoin - Daily Reward");

        /** Refetch */
        await userQuery.refetch();
      }
    },
    [dailyTasksQuery.data]
  );

  /** Open Free Case */
  useFarmerAsyncTask(
    "open-free-case",
    async function () {
      const { freeCaseId } = userQuery.data;

      if (freeCaseId) {
        const freeCase = await getCaseMutation.mutateAsync(freeCaseId);

        /** Log It */
        customLogger("DREAMCOIN FREECASE", freeCase);

        /** Open Case */
        await openCaseMutation.mutateAsync(freeCaseId);

        /** Toast */
        toast.success("DreamCoin - FreeCase");

        /** Refetch */
        await userQuery.refetch();
      }
    },
    [userQuery.data]
  );

  /** Collect Clicker Reward */
  useFarmerAsyncTask(
    "collect-clicker-reward",
    async function () {
      const { currentClicks } = userQuery.data.clickerLevel;

      if (currentClicks > 0) {
        /** Collect */
        await collectClickerRewardMutation.mutateAsync(currentClicks);

        /** Toast */
        toast.success("Dream-Coin Collected Clicker");

        /** Refetch */
        await userQuery.refetch();
      }

      setHasCollectedClickerReward(true);
    },
    [userQuery.data, hasCollectedClickerReward === false]
  );

  /** Auto Upgrade All Level */
  useFarmerAsyncTask(
    "upgrade-all-level",
    async function () {
      const balance = userQuery.data.balance;
      const { upgradePrice } = userQuery.data.clickerLevel;

      if (balance >= upgradePrice) {
        await upgradeAllLevelMutation.mutateAsync();
        toast.success("Dream-Coin Upgraded Level");

        await delay(3000);
        await userQuery.refetch();
      }
    },
    [userQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <>
      <div className="flex flex-col gap-2 py-4">
        {/* Header */}
        <FarmerHeader
          title={"DreamCoin Farmer"}
          icon={DreamCoinIcon}
          referralLink={`https://t.me/DreamCoinOfficial_bot?start=${telegramUser["id"]}`}
        />

        {/* Info */}
        <DreamCoinInfoDisplay />

        <Tabs
          tabs={tabs}
          rootClassName={"gap-0"}
          triggerClassName={"data-[state=active]:border-orange-500"}
        >
          {/* Lottery */}
          <Tabs.Content value="lottery">
            <DreamCoinLottery />
          </Tabs.Content>

          {/* Rewards */}
          <Tabs.Content value="rewards">
            <DreamCoinRewards />
          </Tabs.Content>
        </Tabs>
      </div>
    </>
  );
});
