import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";
import { memo } from "react";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import EnergyIcon from "../assets/images/energy.png?format=webp&w=80";
import TruecoinIcon from "../assets/images/icon.png?format=webp&w=80";
import TruecoinLottery from "./TruecoinLottery";
import TruecoinTasks from "./TruecoinTasks";
import useTruecoinCollectDailyRewardMutation from "../hooks/useTruecoinCollectDailyRewardMutation";
import useTruecoinLastDailyRewardQuery from "../hooks/useTruecoinLastDailyRewardQuery";

export default memo(function TruecoinFarmer() {
  const { authQuery } = useFarmerContext();

  const user = authQuery.data?.user;

  const coins = user?.coins || 0;
  const energy = user?.currentSpins || 0;

  const lastDailyRewardQuery = useTruecoinLastDailyRewardQuery();
  const collectDailyRewardMutation = useTruecoinCollectDailyRewardMutation();

  const tabs = useMirroredTabs("truecoin.farmer-tabs", ["lottery", "tasks"]);

  /** Daily-Check-In */
  useFarmerAsyncTask(
    "daily-check-in",
    () => {
      if (lastDailyRewardQuery.data)
        return async function () {
          try {
            const { createdDate } = lastDailyRewardQuery.data;

            if (!createdDate || !isToday(new Date(createdDate))) {
              await collectDailyRewardMutation.mutateAsync();
              toast.success("Truecoin - Daily Reward");
            }
          } catch {}
        };
    },
    [lastDailyRewardQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={TruecoinIcon}
          alt="Truecoin Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Truecoin Farmer</h1>
      </div>
      <h2 className="font-bold text-center text-purple-500">{user.username}</h2>

      <>
        <h3 className="text-2xl font-bold text-center text-orange-500">
          <img src={CoinIcon} className="inline w-5 h-5" />{" "}
          {Intl.NumberFormat().format(coins)}
        </h3>
        {energy > 0 ? (
          <h4 className="text-lg font-bold text-center text-purple-500">
            <img src={EnergyIcon} className="inline w-5" /> {energy}
          </h4>
        ) : null}
      </>

      <Tabs.Root {...tabs.rootProps} className="flex flex-col">
        <Tabs.List className="grid grid-cols-2">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-purple-500"
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
          <TruecoinLottery />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <TruecoinTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
