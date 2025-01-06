import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn } from "@/lib/utils";
import { memo } from "react";

import FunaticCards from "./FunaticCards";
import FunaticGamer from "./FunaticGamer";
import FunaticIcon from "../assets/images/icon.png?format=webp&w=80";
import FunaticInfoDisplay from "./FunaticInfoDisplay";
import FunaticQuests from "./FunaticQuests";
import useFunaticActivateBoosterMutation from "../hooks/useFunaticActivateBoosterMutation";
import useFunaticBoostersQuery from "../hooks/useFunaticBoostersQuery";
import useFunaticClaimDailyBonusMutation from "../hooks/useFunaticClaimDailyBonusMutation";
import useFunaticDailyBonusQuery from "../hooks/useFunaticDailyBonusQuery";
import useFunaticGameQuery from "../hooks/useFunaticGameQuery";

export default memo(function FunaticFarmer() {
  const tabs = useSocketTabs("funatic.farmer-tabs", [
    "game",
    "cards",
    "quests",
  ]);

  const gameQuery = useFunaticGameQuery();
  const boostersQuery = useFunaticBoostersQuery();
  const dailyBonusQuery = useFunaticDailyBonusQuery();
  const activateBoosterMutation = useFunaticActivateBoosterMutation();
  const claimDailyBonusMutation = useFunaticClaimDailyBonusMutation();

  /** Auto Claim Daily Bonus */
  useFarmerAsyncTask(
    "daily-bonus",
    () => {
      if (dailyBonusQuery.data)
        return async function () {
          const { cooldown } = dailyBonusQuery.data;

          if (cooldown === 0) {
            await claimDailyBonusMutation.mutateAsync();
            toast.success("Funatic - Daily Bonus");
          }
        };
    },
    [dailyBonusQuery.data]
  );

  /** Activate Boosters */
  useFarmerAsyncTask(
    "boosters",
    () => {
      if ([gameQuery.data, boostersQuery.data].every(Boolean))
        return async function () {
          const balance = gameQuery.data?.funz?.currentFunzBalance || 0;
          const availableBoosters = boostersQuery.data.filter(
            (item) =>
              item.currency === "funz" &&
              item.price <= balance &&
              item.isPermanent === false &&
              item.isActive === false &&
              item.cooldownLeft === 0 &&
              item.usagesLeft > 0
          );

          if (availableBoosters.length) {
            for (const booster of availableBoosters) {
              /** Activate */
              await activateBoosterMutation.mutateAsync(booster.type);

              /** Toast */
              toast.success(`Funatic - Booster (${booster.name})`);

              /** Delay */
              await delay(1000);
            }

            /** Refetch */
            await gameQuery.refetch();
            await boostersQuery.refetch();
          }
        };
    },
    [gameQuery.data, boostersQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-3 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={FunaticIcon}
          alt="Funatic Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Funatic Farmer</h1>
      </div>

      {/* Info */}
      <FunaticInfoDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col">
        <Tabs.List className="grid grid-cols-3">
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

        {/* Game */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="game"
        >
          <FunaticGamer />
        </Tabs.Content>

        {/* Cards */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="cards"
        >
          <FunaticCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="quests"
        >
          <FunaticQuests />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
