import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn, delay } from "@/lib/utils";
import { isAfter } from "date-fns";
import { memo } from "react";
import { useEffect } from "react";

import TomarketAutoGamer from "./TomarketAutoGamer";
import TomarketBalanceDisplay from "./TomarketBalanceDisplay";
import TomarketFarmerHeader from "./TomarketFarmerHeader";
import TomarketTickets from "./TomarketTickets";
import useTomarketClaimFarmingMutation from "../hooks/useTomarketClaimFarmingMutation";
import useTomarketDailyCheckInMutation from "../hooks/useTomarketDailyCheckInMutation";
import useTomarketFarmingInfoQuery from "../hooks/useTomarketFarmingInfoQuery";
import useTomarketStartFarmingMutation from "../hooks/useTomarketStartFarmingMutation";

export default memo(function TomarketFarmer() {
  const { tomarket } = useFarmerContext();

  const tabs = useSocketTabs("tomarket.farmer-tabs", ["game", "tickets"]);

  const farmingInfoQuery = useTomarketFarmingInfoQuery();
  const dailyCheckInMutation = useTomarketDailyCheckInMutation();
  const startFarmingMutation = useTomarketStartFarmingMutation();
  const claimFarmingMutation = useTomarketClaimFarmingMutation();

  /** Daily Check-In */
  useEffect(() => {
    (async function () {
      const result = await dailyCheckInMutation.mutateAsync(tomarket.daily);

      if (result.message === "") {
        toast.success("Tomarket Daily Check-In");
      }
    })();
  }, [tomarket]);

  /** Farming */
  useFarmerAsyncTask(
    "farming",
    () => {
      if (farmingInfoQuery.data) {
        return async function () {
          const farm = farmingInfoQuery.data;

          if (!farm["round_id"]) {
            /** Start Farming */
            await startFarmingMutation.mutateAsync();
            toast.success("Tomarket - Started Farming");
          } else if (
            farm["end_at"] &&
            isAfter(new Date(), new Date(farm["end_at"] * 1000))
          ) {
            /** Claim Farming */
            await claimFarmingMutation.mutateAsync();
            toast.success("Tomarket - Claimed Farming");

            /** Delay */
            await delay(1000);

            /** Start Farming */
            await startFarmingMutation.mutateAsync();
            toast.success("Tomarket - Started Farming");
          }
        };
      }
    },
    [farmingInfoQuery.data]
  );

  /** Auto-Tabs */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col p-4">
      <TomarketFarmerHeader />
      <TomarketBalanceDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-2">
        <Tabs.List className="grid grid-cols-2">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-white"
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
          <TomarketAutoGamer tomarket={tomarket} />
        </Tabs.Content>

        {/* Tickets */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tickets"
        >
          <TomarketTickets />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
