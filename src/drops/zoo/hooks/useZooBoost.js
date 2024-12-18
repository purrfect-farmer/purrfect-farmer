import toast from "react-hot-toast";
import useFarmerAutoTask from "@/hooks/useFarmerAutoTask";
import { useCallback } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import useZooBuyBoostMutation from "./useZooBuyBoostMutation";
import useZooDataQueries from "./useZooDataQueries";

export default function useZooBoost() {
  const dataQueries = useZooDataQueries();
  const [allData] = dataQueries.data;

  const hero = allData?.hero;
  const balance = hero?.coins;
  const currentBoostPercent = hero?.boostPercent;

  const queryClient = useQueryClient();
  const buyBoostMutation = useZooBuyBoostMutation();

  /** Available Boosts */
  const boosts = useMemo(
    () =>
      allData?.dbData.dbBoost
        .filter((item) => item.price <= balance)
        .sort((a, b) => b.price - a.price),
    [allData, balance]
  );

  /** Purchase Boost */
  const purchaseBoost = useCallback(
    async (processNextTask) => {
      try {
        if (boosts.length) {
          const boost = boost[0];

          if (boost.boost !== currentBoostPercent) {
            /** Buy Boost */
            const result = await buyBoostMutation.mutateAsync(boost.key);

            /** Update Data */
            queryClient.setQueryData(["zoo", "all"], (prev) => {
              return {
                ...prev,
                ...result,
              };
            });

            /** Toast */
            toast.success("Purchased Boost");
          }
        }
      } catch {}

      /** Process Next Task */
      processNextTask();
    },
    [boosts, currentBoostPercent]
  );

  /** Farmer Auto Task */
  useFarmerAutoTask(
    "purchase-boost",
    (zoomies) => {
      purchaseBoost(zoomies.processNextTask);
    },
    [purchaseBoost]
  );
}
