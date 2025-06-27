import FarmerHeader from "@/components/FarmerHeader";
import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { customLogger } from "@/lib/utils";
import { differenceInSeconds, isAfter } from "date-fns";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import SpaceAdventureBoosts from "./SpaceAdventureBoosts";
import SpaceAdventureHourlyAds from "./SpaceAdventureHourlyAds";
import SpaceAdventureIcon from "../assets/images/icon.png?format=webp&w=80";
import SpaceAdventureInfoDisplay from "./SpaceAdventureInfoDisplay";
import SpaceAdventureTasks from "./SpaceAdventureTasks";
import useSpaceAdventureBoostsQuery from "../hooks/useSpaceAdventureBoostsQuery";
import useSpaceAdventureBuyBoostMutation from "../hooks/useSpaceAdventureBuyBoostMutation";
import useSpaceAdventureBuyRouletteMutation from "../hooks/useSpaceAdventureBuyRouletteMutation";
import useSpaceAdventureClaimMutation from "../hooks/useSpaceAdventureClaimMutation";
import useSpaceAdventureDailyClaimMutation from "../hooks/useSpaceAdventureDailyClaimMutation";
import useSpaceAdventureGetAdsMutation from "../hooks/useSpaceAdventureGetAdsMutation";
import useSpaceAdventureGetCaptchaMutation from "../hooks/useSpaceAdventureGetCaptchaMutation";
import useSpaceAdventureNewsMutation from "../hooks/useSpaceAdventureNewsMutation";
import useSpaceAdventureSolveCaptchaMutation from "../hooks/useSpaceAdventureSolveCaptchaMutation";
import useSpaceAdventureTutorialMutation from "../hooks/useSpaceAdventureTutorialMutation";
import useSpaceAdventureUserQuery from "../hooks/useSpaceAdventureUserQuery";

export default memo(function SpaceAdventureFarmer() {
  const { telegramUser } = useFarmerContext();
  const tabs = useMirroredTabs("space-adventure.farmer-tabs", [
    "hourly-ads",
    "boosts",
    "tasks",
  ]);

  const queryClient = useQueryClient();
  const userQuery = useSpaceAdventureUserQuery();
  const boostsQuery = useSpaceAdventureBoostsQuery();
  const getAdsMutation = useSpaceAdventureGetAdsMutation();
  const buyBoostMutation = useSpaceAdventureBuyBoostMutation();
  const buyRouletteMutation = useSpaceAdventureBuyRouletteMutation();
  const tutorialMutation = useSpaceAdventureTutorialMutation();
  const claimMutation = useSpaceAdventureClaimMutation();
  const dailyClaimMutation = useSpaceAdventureDailyClaimMutation();
  const newsMutation = useSpaceAdventureNewsMutation();
  const getCaptchaMutation = useSpaceAdventureGetCaptchaMutation();
  const solveCaptchaMutation = useSpaceAdventureSolveCaptchaMutation();

  /** Get Status */
  const status = useMemo(() => {
    if (userQuery.data && boostsQuery.data) {
      const { user } = userQuery.data;
      const boosts = boostsQuery.data.list;

      const localeTime = user["locale_time"];

      const timePassed = differenceInSeconds(
        user["shield_ended_at"]
          ? new Date(user["shield_ended_at"])
          : new Date(localeTime),
        new Date(user["claimed_last"])
      );
      
      const lowFuelInSeconds = 10 * 60;
      const fuelEnd = user["fuel_last_at"] + user["fuel"] * 1000;
      const remainingFuelInSeconds = differenceInSeconds(
        new Date(fuelEnd),
        new Date(localeTime)
      );

      const unclaimed = user["claim"] * timePassed;

      const canBuyFuel =
        remainingFuelInSeconds <= lowFuelInSeconds &&
        isAfter(new Date(localeTime), new Date(user["fuel_free_at"]));

      const canClaim = unclaimed >= user["claim_max"];
      const canBuyShield =
        user["shield_damage"] > 0 &&
        isAfter(new Date(localeTime), new Date(user["shield_free_at"]));

      const canBuyImmunity =
        isAfter(new Date(localeTime), new Date(user["shield_immunity_at"])) &&
        isAfter(
          new Date(localeTime),
          new Date(user["shield_free_immunity_at"])
        );

      const canSpin = isAfter(
        new Date(localeTime),
        new Date(user["spin_after_at"])
      );

      const canSkipTutorial = user["tutorial"] !== true;
      const canReadNews = user["new_post"] !== true;

      const canClaimDailyReward = isAfter(
        new Date(localeTime),
        new Date(user["daily_next_at"])
      );

      return {
        user,
        boosts,
        unclaimed,
        remainingFuelInSeconds,
        canClaim,
        canBuyFuel,
        canBuyShield,
        canBuyImmunity,
        canSpin,
        canReadNews,
        canSkipTutorial,
        canClaimDailyReward,
      };
    }
  }, [userQuery.data, boostsQuery.data]);

  /** Update User */
  const updateUser = useCallback(
    (user) =>
      queryClient.setQueryData(["space-adventure", "user"], (prev) => ({
        ...prev,
        user,
      })),
    [queryClient.setQueryData]
  );

  /** Shop Free Item */
  const shopFreeItem = useCallback(
    async (type) => {
      /** Get Item */
      const shopItem = boostsQuery.data.list.find(
        (item) => item["single_type"] === type
      );

      /** Get Ad */
      await getAdsMutation.mutateAsync("shop_free_" + type);

      /** Buy Item */
      const { user } = await buyBoostMutation.mutateAsync({ id: shopItem.id });

      /** Update User */
      updateUser(user);
    },
    [
      updateUser,
      boostsQuery.data,
      queryClient.setQueryData,
      getAdsMutation.mutateAsync,
      buyBoostMutation.mutateAsync,
    ]
  );

  /** Skip Tutorial */
  useFarmerAsyncTask(
    "skip-tutorial",
    async function () {
      if (status.canSkipTutorial) {
        const skipTutorial = async () => {
          /** Mutate */
          const { user } = await tutorialMutation.mutateAsync();

          /** Update User */
          updateUser(user);
        };

        await toast.promise(skipTutorial(), {
          loading: "Skipping tutorial...",
          success: "Successfully skipped tutorial...",
          error: "Can't skip tutorial!",
        });
      }
    },
    [status, updateUser]
  );

  /** Read News */
  useFarmerAsyncTask(
    "read-news",
    async function () {
      if (status.canReadNews) {
        const readNews = async () => {
          /** Mutate */
          const { user } = await newsMutation.mutateAsync();

          /** Update User */
          updateUser(user);
        };

        await toast.promise(readNews(), {
          loading: "Reading News...",
          success: "Successfully read news!",
          error: "Failed to read news!",
        });
      }
    },
    [status, updateUser]
  );

  /** Daily Claim */
  useFarmerAsyncTask(
    "daily-claim",
    async function () {
      if (status.canClaimDailyReward) {
        const collectCoins = async () => {
          await getAdsMutation.mutateAsync("daily_activity");
          /** Mutate */
          const { user } = await dailyClaimMutation.mutateAsync();

          /** Update User */
          updateUser(user);
        };

        await toast.promise(collectCoins(), {
          loading: "Claiming daily reward...",
          success: "Successfully claimed daily reward!",
          error: "Can't claim daily reward!",
        });
      }
    },
    [status, updateUser]
  );

  /** Claim Mining */
  useFarmerAsyncTask(
    "claim-mining",
    async function () {
      if (status.canClaim) {
        const collectCoins = async () => {
          /** Get Ad */
          await getAdsMutation.mutateAsync("claim_coins");

          /** Get Captcha */
          const { captchaTrue, captchaList } =
            await getCaptchaMutation.mutateAsync();

          /** Solve Captcha */
          await solveCaptchaMutation.mutateAsync(
            captchaList.find((item) => item.img === captchaTrue).value
          );

          /** Mutate */
          const { user } = await claimMutation.mutateAsync();

          /** Update User */
          updateUser(user);
        };

        await toast.promise(collectCoins(), {
          loading: "Claiming...",
          success: "Successfully claimed...",
          error: "Can't collect coin!",
        });
      }
    },
    [status, updateUser]
  );

  /** Buy Fuel */
  useFarmerAsyncTask(
    "buy-fuel",
    async function () {
      if (status.canBuyFuel) {
        /** Shop Free Fuel */
        await toast.promise(shopFreeItem("fuel"), {
          loading: "Buying Fuel...",
          success: "Successfully bought fuel!",
          error: "Can't buy fuel!",
        });
      }
    },
    [status, shopFreeItem]
  );

  /** Buy Shield */
  useFarmerAsyncTask(
    "buy-shield",
    async function () {
      if (status.canBuyShield) {
        /** Shop Free Shield */
        await toast.promise(shopFreeItem("shield"), {
          loading: "Buying Shield...",
          success: "Successfully bought shield!",
          error: "Can't buy shield!",
        });
      }
    },
    [status, shopFreeItem]
  );

  /** Buy Immunity */
  useFarmerAsyncTask(
    "buy-immunity",
    async function () {
      if (status.canBuyImmunity) {
        /** Shop Free Immunity */
        await toast.promise(shopFreeItem("immunity"), {
          loading: "Buying Immunity...",
          success: "Successfully bought immunity!",
          error: "Can't buy immunity!",
        });
      }
    },
    [status, shopFreeItem]
  );

  /** Spin */
  useFarmerAsyncTask(
    "spin",
    async function () {
      if (status.canSpin) {
        const spinForFree = async () => {
          /** Get Ad */
          await getAdsMutation.mutateAsync("spin_roulete");

          /** Mutate */
          const { user } = await buyRouletteMutation.mutateAsync();

          /** Update User */
          updateUser(user);
        };

        await toast.promise(spinForFree(), {
          loading: "Spinning...",
          success: "Successfully claimed Spin...",
          error: "Can't spin!",
        });
      }
    },
    [status, updateUser]
  );

  /** Log */
  useEffect(() => {
    customLogger("SPACE ADVENTURE STATUS", status);
  }, [status]);

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <FarmerHeader
        title={"Space Adventure Farmer"}
        icon={SpaceAdventureIcon}
        referralLink={`https://t.me/spaceadv_game_bot/play?startapp=${telegramUser["id"]}`}
      />

      {/* Info */}
      <SpaceAdventureInfoDisplay />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"data-[state=active]:border-purple-500"}
        className="flex flex-col"
      >
        {/* Hourly Ads */}
        <Tabs.Content value="hourly-ads">
          <SpaceAdventureHourlyAds />
        </Tabs.Content>

        {/* Boosts */}
        <Tabs.Content value="boosts">
          <SpaceAdventureBoosts />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content value="tasks">
          <SpaceAdventureTasks />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
