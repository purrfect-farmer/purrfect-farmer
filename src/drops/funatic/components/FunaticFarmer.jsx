import FarmerHeader from "@/components/FarmerHeader";
import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { delay } from "@/lib/utils";
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
import useFunaticExchangesQuery from "../hooks/useFunaticExchangesQuery";
import useFunaticGameQuery from "../hooks/useFunaticGameQuery";
import useFunaticSetExchangeMutation from "../hooks/useFunaticSetExchangeMutation";
import useFunaticUserQuery from "../hooks/useFunaticUserQuery";

export default memo(function FunaticFarmer() {
  const { telegramUser } = useFarmerContext();
  const tabs = useMirroredTabs("funatic.farmer-tabs", [
    "game",
    "cards",
    "quests",
  ]);

  const userQuery = useFunaticUserQuery();
  const exchangesQuery = useFunaticExchangesQuery();
  const gameQuery = useFunaticGameQuery();
  const boostersQuery = useFunaticBoostersQuery();
  const dailyBonusQuery = useFunaticDailyBonusQuery();
  const setExchangeMutation = useFunaticSetExchangeMutation();
  const activateBoosterMutation = useFunaticActivateBoosterMutation();
  const claimDailyBonusMutation = useFunaticClaimDailyBonusMutation();

  /** Auto Claim Daily Bonus */
  useFarmerAsyncTask(
    "daily-bonus",
    async function () {
      const { cooldown } = dailyBonusQuery.data;

      if (cooldown === 0) {
        /** Claim Daily Bonus */
        await claimDailyBonusMutation.mutateAsync();

        /** Toast */
        toast.success("Funatic - Daily Bonus");

        /** Refetch */
        await gameQuery.refetch();
      }
    },
    [dailyBonusQuery.data]
  );

  /** Activate Boosters */
  useFarmerAsyncTask(
    "boosters",
    async function () {
      const availableBoosters = boostersQuery.data.filter(
        (item) =>
          item.price === 0 &&
          item.isActive === false &&
          item.cooldownLeft === 0 &&
          item.usagesLeft !== 0
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
        await boostersQuery.refetch();
      }
    },
    [boostersQuery.data]
  );

  /** Set Exchange */
  useFarmerAsyncTask(
    "set-exchange",
    async function () {
      const { user } = userQuery.data;
      const cryptoExchange = user.cryptoExchange;

      if (cryptoExchange.id === null) {
        const collection = exchangesQuery.data;
        const exchange =
          collection[Math.floor(Math.random() * collection.length)];

        /** Set Exchange */
        await setExchangeMutation.mutateAsync(exchange.id);

        /** Toast */
        toast.success(`Funatic Set Exchange - ${exchange.name}`);

        /** Refetch */
        await userQuery.refetch();
        await exchangesQuery.refetch();
      }
    },
    [userQuery.data, exchangesQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-3 py-4">
      {/* Header */}
      <FarmerHeader
        title={"Funatic Farmer"}
        icon={FunaticIcon}
        referralLink={`https://t.me/LuckyFunaticBot/lucky_funatic?startapp=${telegramUser["id"]}`}
      />

      {/* Info */}
      <FunaticInfoDisplay />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"data-[state=active]:border-purple-500"}
      >
        {/* Game */}
        <Tabs.Content value="game">
          <FunaticGamer />
        </Tabs.Content>

        {/* Cards */}
        <Tabs.Content value="cards">
          <FunaticCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content value="quests">
          <FunaticQuests />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
