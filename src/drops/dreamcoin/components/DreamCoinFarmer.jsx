import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn, delay } from "@/lib/utils";

import DreamCoinIcon from "../assets/images/icon.png?format=webp&w=80";
import DreamCoinInfoDisplay from "./DreamCoinInfoDisplay";
import DreamCoinLottery from "./DreamCoinLottery";
import DreamCoinRewards from "./DreamCoinRewards";
import useDreamCoinClaimDailyTaskMutation from "../hooks/useDreamCoinClaimDailyTaskMutation";
import useDreamCoinDailyTasksQuery from "../hooks/useDreamCoinDailyTasksQuery";
import useDreamCoinLevelQuery from "../hooks/useDreamCoinLevelQuery";
import useDreamCoinUpgradeAllLevelMutation from "../hooks/useDreamCoinUpgradeAllLevelMutation";
import useDreamCoinUserQuery from "../hooks/useDreamCoinUserQuery";

export default function DreamCoinFarmer() {
  const tabs = useSocketTabs("dreamcoin.farmer-tabs", ["lottery", "rewards"]);

  const userQuery = useDreamCoinUserQuery();
  const levelQuery = useDreamCoinLevelQuery();
  const dailyTasksQuery = useDreamCoinDailyTasksQuery();
  const claimDailyTaskMutation = useDreamCoinClaimDailyTaskMutation();
  const upgradeAllLevelMutation = useDreamCoinUpgradeAllLevelMutation();

  /** Auto Claim Daily Reward */
  useFarmerAsyncTask(
    "daily-reward",
    () => {
      if (dailyTasksQuery.data)
        return async function () {
          const today = new Date().toISOString().split("T")[0];
          const dailyTasks = dailyTasksQuery.data.dailyTasks;

          const day = dailyTasks.find(
            (item) => item.date === today && !item.isClaimed
          );
          if (day) {
            await claimDailyTaskMutation.mutateAsync(item.id);
            toast.success("DreamCoin - Daily Reward");
          }
        };
    },
    [dailyTasksQuery.data]
  );

  /** Auto Upgrade All Level */
  useFarmerAsyncTask(
    "upgrade-all-level",
    () => {
      if (userQuery.data && levelQuery.data)
        return async function () {
          const totalGoldCost = levelQuery.data.totalGoldCost;
          const balance = userQuery.data.balance;

          if (balance >= totalGoldCost) {
            await upgradeAllLevelMutation.mutateAsync();
            toast.success("Dream-Coin Upgraded Level");

            await delay(3000);
            await levelQuery.refetch();
            await userQuery.refetch();
          }
        };
    },
    [userQuery.data, levelQuery.data]
  );

  return (
    <>
      <div className="flex flex-col gap-2 py-4">
        {/* Header */}
        <div className="flex items-center justify-center gap-2">
          <img
            src={DreamCoinIcon}
            alt="DreamCoin Farmer"
            className="w-8 h-8 rounded-full"
          />
          <h1 className="font-bold">DreamCoin Farmer</h1>
        </div>

        {/* Info */}
        <DreamCoinInfoDisplay />

        <Tabs.Root {...tabs.rootProps} className="flex flex-col">
          <Tabs.List className="grid grid-cols-2">
            {tabs.list.map((value, index) => (
              <Tabs.Trigger
                key={index}
                value={value}
                className={cn(
                  "p-2",
                  "border-b-4 border-transparent",
                  "data-[state=active]:border-orange-500"
                )}
              >
                {value.toUpperCase()}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Lottery */}
          <Tabs.Content
            forceMount
            className="data-[state=inactive]:hidden"
            value="lottery"
          >
            <DreamCoinLottery />
          </Tabs.Content>

          {/* Rewards */}
          <Tabs.Content
            forceMount
            className="data-[state=inactive]:hidden"
            value="rewards"
          >
            <DreamCoinRewards />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </>
  );
}
