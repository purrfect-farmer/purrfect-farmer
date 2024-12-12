import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";

import TsubasaCards from "./TsubasaCards";
import TsubasaIcon from "../assets/images/icon.png?format=webp&w=80";
import TsubasaInfoDisplay from "./TsubasaInfoDisplay";
import TsubasaTasks from "./TsubasaTasks";
import useTsubasaClaimDailyRewardMutation from "../hooks/useTsubasaClaimDailyRewardMutation";

export default function TsubasaFarmer() {
  const tabs = useSocketTabs("tsubasa.farmer-tabs", ["cards", "tasks"]);
  const { authQuery } = useFarmerContext();
  const claimDailyRewardMutation = useTsubasaClaimDailyRewardMutation();

  /** Auto Claim Daily Reward */
  useFarmerAsyncTask(
    "daily-reward",
    () => {
      if (authQuery.data)
        return async function () {
          const lastUpdate = authQuery.data["user_daily_reward"]["last_update"];

          if (!isToday(lastUpdate * 1000)) {
            await claimDailyRewardMutation.mutateAsync();
            toast.success("Tsubasa - Daily Reward");
          }
        };
    },
    [authQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={TsubasaIcon}
          alt="Tsubasa Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Tsubasa Farmer</h1>
      </div>

      {/* Info */}
      <TsubasaInfoDisplay />

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
          <TsubasaCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <TsubasaTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
