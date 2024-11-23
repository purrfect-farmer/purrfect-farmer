import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerContext from "@/hooks/useFarmerContext";
import { delay } from "@/lib/utils";
import { isAfter } from "date-fns";
import { useEffect } from "react";

import TomarketAutoGamer from "./TomarketAutoGamer";
import TomarketBalanceDisplay from "./TomarketBalanceDisplay";
import TomarketFarmerHeader from "./TomarketFarmerHeader";
import useTomarketClaimFarmingMutation from "../hooks/useTomarketClaimFarmingMutation";
import useTomarketDailyCheckInMutation from "../hooks/useTomarketDailyCheckInMutation";
import useTomarketFarmingInfoQuery from "../hooks/useTomarketFarmingInfoQuery";
import useTomarketStartFarmingMutation from "../hooks/useTomarketStartFarmingMutation";

export default function TomarketFarmer() {
  const { tomarket } = useFarmerContext();

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

  return (
    <div className="flex flex-col p-4">
      <TomarketFarmerHeader />
      <TomarketBalanceDisplay />

      <TomarketAutoGamer tomarket={tomarket} />
    </div>
  );
}
