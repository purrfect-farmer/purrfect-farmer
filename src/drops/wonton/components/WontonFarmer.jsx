import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { customLogger, delay } from "@/lib/utils";
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
import useWontonDrawBasicBoxMutation from "../hooks/useWontonDrawBasicBoxMutation";
import useWontonFarmingStatusQuery from "../hooks/useWontonFarmingStatusQuery";
import useWontonPurchaseBasicBoxMutation from "../hooks/useWontonPurchaseBasicBoxMutation";
import useWontonShopQuery from "../hooks/useWontonShopQuery";
import useWontonStartFarmingMutation from "../hooks/useWontonStartFarmingMutation";
import useWontonUseShopItemMutation from "../hooks/useWontonUseShopItemMutation";
import useWontonUserQuery from "../hooks/useWontonUserQuery";

export default memo(function WontonFarmer() {
  const tabs = useMirroredTabs("wonton.farmer-tabs", [
    "game",
    "badges",
    "tasks",
  ]);

  const dailyCheckInMutation = useWontonDailyCheckInMutation();

  const userQuery = useWontonUserQuery();
  const farmingStatusQuery = useWontonFarmingStatusQuery();
  const startFarmingMutation = useWontonStartFarmingMutation();
  const claimFarmingMutation = useWontonClaimFarmingMutation();

  const shopQuery = useWontonShopQuery();
  const useShopItemMutation = useWontonUseShopItemMutation();
  const purchaseBasicBoxMutation = useWontonPurchaseBasicBoxMutation();
  const drawBasicBoxMutation = useWontonDrawBasicBoxMutation();

  /** Daily-Check-In */
  useFarmerAsyncTask(
    "daily-check-in",
    async function () {
      try {
        const data = await dailyCheckInMutation.mutateAsync();
        if (data.newCheckin) {
          toast.success("Wonton Daily Check-In");
        }
      } catch {}
    },
    []
  );

  /** Draw Basic Box */
  useFarmerAsyncTask(
    "draw-basic-box",
    async function () {
      const shop = shopQuery.data;
      const basicBox = shop.blindbox.basicBox;
      const available = basicBox.balance;
      const canDraw = available > 0;

      /** Log */
      customLogger("WONTON AVAILABLE BASIC BOX", available);

      if (!canDraw) return;

      /** Set Initial Balance */
      let balance = available;

      while (balance > 0) {
        /** Get Amount */
        const amount = Math.min(3, balance);

        /** Deduct Balance */
        balance -= amount;

        /** Draw */
        await drawBasicBoxMutation.mutateAsync(amount);

        /** Toast */
        toast.success("Wonton - Draw Basic Box");

        /** Delay */
        await delay(500);
      }

      /** Refetch */
      await shopQuery.refetch();
    },
    [shopQuery.data]
  );

  /** Select Top Item */
  useFarmerAsyncTask(
    "use-top-shop-item",
    async function () {
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

      /** Status */
      let status = false;

      /** Log */
      customLogger("WONTON OWNED SHOP ITEMS", items);

      /** Log */
      customLogger("WONTON OWNED SKINS", skins);
      customLogger("WONTON SELECTED SKIN", selectedSkin);
      customLogger("WONTON TOP SKIN", topSkin);

      /** Log */
      customLogger("WONTON OWNED BOWLS", bowls);
      customLogger("WONTON SELECTED BOWL", selectedBowl);
      customLogger("WONTON TOP BOWL", topBowl);

      if (topSkin && topSkin.id !== selectedSkin?.id) {
        /** Use Item */
        await useShopItemMutation.mutateAsync(topSkin.id);

        /** Toast */
        toast.success("Wonton - Used Top Skin");

        /** Set Status */
        status = true;
      }

      if (topBowl && topBowl.id !== selectedBowl?.id) {
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
    },
    [shopQuery.data]
  );

  /** Auto-Claim Farming */
  useFarmerAsyncTask(
    "farming",
    async function () {
      // Check
      const farming = farmingStatusQuery.data;

      if (!farming.finishAt || farming.claimed) {
        /** Start Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("Wonton Started Farming");

        /** Refetch */
        await farmingStatusQuery.refetch();
      } else if (isAfter(new Date(), new Date(farming.finishAt))) {
        /** Claim Farming */
        await claimFarmingMutation.mutateAsync();
        toast.success("Wonton Claimed Previous Farming");

        /** Start Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("Wonton Started Farming");

        /** Refetch */
        await farmingStatusQuery.refetch();
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

      <Tabs
        tabs={tabs}
        rootClassName={"gap-4"}
        triggerClassName={"data-[state=active]:border-wonton-green-500"}
      >
        <Tabs.Content value="game">
          <WontonAutoGamer />
        </Tabs.Content>
        <Tabs.Content value="badges">
          <WontonAutoBadges />
        </Tabs.Content>
        <Tabs.Content value="tasks">
          <WontonAutoTasks />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
