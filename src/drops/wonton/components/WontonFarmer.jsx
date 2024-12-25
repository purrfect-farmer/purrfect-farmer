import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn, logNicely } from "@/lib/utils";
import { isAfter } from "date-fns";
import { memo } from "react";

import WontonAutoBadges from "./WontonBadges";
import WontonAutoGamer from "./WontonAutoGamer";
import WontonAutoTasks from "./WontonAutoTasks";
import WontonBalanceDisplay from "./WontonBalanceDisplay";
import WontonFarmerHeader from "./WontonFarmerHeader";
import WontonUsernameDisplay from "./WontonUsernameDisplay";
import useWontonClaimFarmingMutation from "../hooks/useWontonClaimFarmingMutation";
import useWontonDailyCheckInMutation from "../hooks/useWontonDailyCheckInMutation";
import useWontonFarmingStatusQuery from "../hooks/useWontonFarmingStatusQuery";
import useWontonShopQuery from "../hooks/useWontonShopQuery";
import useWontonStartFarmingMutation from "../hooks/useWontonStartFarmingMutation";
import useWontonUseShopItemMutation from "../hooks/useWontonUseShopItemMutation";
import { useState } from "react";

export default memo(function WontonFarmer() {
  const tabs = useSocketTabs("wonton.farmer-tabs", ["game", "badges", "tasks"]);

  const dailyCheckInMutation = useWontonDailyCheckInMutation();

  const farmingStatusQuery = useWontonFarmingStatusQuery();
  const startFarmingMutation = useWontonStartFarmingMutation();
  const claimFarmingMutation = useWontonClaimFarmingMutation();

  const shopQuery = useWontonShopQuery();
  const useShopItemMutation = useWontonUseShopItemMutation();

  const [hasClaimedDailyCheckIn, setHasClaimedDailyCheckIn] = useState(false);

  /** Daily-Check-In */
  useFarmerAsyncTask(
    "daily-check-in",
    () => {
      if (!hasClaimedDailyCheckIn) {
        return async function () {
          try {
            const data = await dailyCheckInMutation.mutateAsync();
            if (data.newCheckin) {
              toast.success("Wonton Daily Check-In");
            }
          } catch {}

          setHasClaimedDailyCheckIn(true);
        };
      }
    },
    [hasClaimedDailyCheckIn]
  );

  /** Select Top Item */
  useFarmerAsyncTask(
    "use-top-shop-item",
    () => {
      if (shopQuery.data) {
        const shopItems = shopQuery.data.shopItems;
        const items = shopItems.filter((item) => item.inventory > 0);
        const skins = items.filter((item) => Number(item.farmingPower) !== 0);
        const bowls = items.filter((item) => Number(item.farmingPower) === 0);

        const selectedSkin = skins.find((item) => item.inUse);
        const selectedBowl = bowls.find((item) => item.bowlDisplay);

        /** Top Skin */
        const topSkin =
          skins.length > 0
            ? skins.reduce((result, current) => {
                return Math.max(...current.stats.map(Number)) >
                  Math.max(...result.stats.map(Number))
                  ? current
                  : result;
              }, skins[0])
            : null;

        /** Top Bowl */
        const topBowl =
          bowls.length > 0
            ? bowls.reduce((result, current) => {
                return Number(current.value) > Number(result.value)
                  ? current
                  : result;
              }, bowls[0])
            : null;

        /** Log */
        logNicely("WONTON OWNED SHOP ITEMS", items);

        /** Log */
        logNicely("WONTON OWNED SKINS", skins);
        logNicely("WONTON SELECTED SKIN", selectedSkin);
        logNicely("WONTON TOP SKIN", topSkin);

        /** Log */
        logNicely("WONTON OWNED BOWLS", bowls);
        logNicely("WONTON SELECTED BOWL", selectedBowl);
        logNicely("WONTON TOP BOWL", topBowl);

        const shouldUseTopSkin = topSkin && topSkin.id !== selectedSkin?.id;
        const shouldUseTopBowl = topBowl && topBowl.id !== selectedBowl?.id;

        if (shouldUseTopSkin || shouldUseTopBowl) {
          return async function () {
            /** Status */
            let status = false;

            if (shouldUseTopSkin) {
              /** Use Item */
              await useShopItemMutation.mutateAsync(topSkin.id);

              /** Toast */
              toast.success("Wonton - Used Top Skin");

              /** Set Status */
              status = true;
            }

            if (shouldUseTopBowl) {
              /** Use Item */
              await useShopItemMutation.mutateAsync(topBowl.id);

              /** Toast */
              toast.success("Wonton - Used Top Bowl");

              /** Set Status */
              status = true;
            }

            if (status) {
              /** Refetch */
              await shopQuery.refetch();
            }
          };
        }
      }
    },
    [shopQuery.data]
  );

  /** Auto-Claim Farming */
  useFarmerAsyncTask(
    "farming",
    () => {
      if (farmingStatusQuery.data) {
        // Check
        const farming = farmingStatusQuery.data;

        if (!farming.finishAt || farming.claimed) {
          return async function () {
            /** Start Farming */
            await startFarmingMutation.mutateAsync();
            toast.success("Wonton Started Farming");

            /** Refetch */
            await farmingStatusQuery.refetch();
          };
        } else if (isAfter(new Date(), new Date(farming.finishAt))) {
          return async function () {
            /** Claim Farming */
            await claimFarmingMutation.mutateAsync();
            toast.success("Wonton Claimed Previous Farming");

            /** Start Farming */
            await startFarmingMutation.mutateAsync();
            toast.success("Wonton Started Farming");

            /** Refetch */
            await farmingStatusQuery.refetch();
          };
        }
      }
    },
    [farmingStatusQuery.data]
  );

  /** Automatically Switch Tab */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col p-4">
      <WontonFarmerHeader />
      <WontonUsernameDisplay />
      <WontonBalanceDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-3">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-2 border-transparent",
                "data-[state=active]:border-wonton-green-500"
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
          <WontonAutoGamer />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="badges"
        >
          <WontonAutoBadges />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <WontonAutoTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
