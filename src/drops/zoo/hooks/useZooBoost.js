import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { isAfter } from "date-fns";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import useZooBuyBoostMutation from "./useZooBuyBoostMutation";
import useZooDataQueries from "./useZooDataQueries";
import useZooShouldBuyFeed from "./useZooShouldBuyFeed";

export default function useZooBoost() {
  const queryClient = useQueryClient();
  const buyBoostMutation = useZooBuyBoostMutation();
  const dataQueries = useZooDataQueries();

  const [allData] = dataQueries.data;
  const shouldBuyFeed = useZooShouldBuyFeed();

  const hero = allData?.hero;
  const balance = hero?.coins;

  const currentBoostPercent = hero?.boostPercent || 0;
  const boostExpiredDate = hero?.boostExpiredDate;
  const hasExpired = useMemo(
    () =>
      boostExpiredDate && isAfter(new Date(), new Date(boostExpiredDate + "Z")),
    [boostExpiredDate]
  );
  const availableBoosts = useMemo(
    () => allData?.dbData.dbBoost.filter((item) => item.price <= balance) || [],
    [balance, allData?.dbData.dbBoost]
  );

  const boost = useMemo(
    () => availableBoosts.find((item) => item.price === 1000),
    [availableBoosts]
  );

  const shouldPurchase =
    shouldBuyFeed === false &&
    boost &&
    (boost.boost > currentBoostPercent || hasExpired);

  useFarmerAsyncTask(
    "purchase-boost",
    () => {
      return async function () {
        if (shouldPurchase) {
          /** Buy Boost */
          const result = await buyBoostMutation.mutateAsync(boost.key);

          if (result) {
            /** Update Data */
            queryClient.setQueryData(["zoo", "all"], (prev) => {
              return {
                ...prev,
                ...result,
              };
            });
          }

          /** Toast */
          toast.success("Purchased Boost");
        }
      };
    },
    [boost, shouldPurchase]
  );
}
