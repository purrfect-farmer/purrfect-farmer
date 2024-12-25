import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { useQueryClient } from "@tanstack/react-query";

import useZooBuyBoostMutation from "./useZooBuyBoostMutation";
import useZooDataQueries from "./useZooDataQueries";

export default function useZooBoost() {
  const queryClient = useQueryClient();
  const buyBoostMutation = useZooBuyBoostMutation();
  const dataQueries = useZooDataQueries();

  const [allData] = dataQueries.data;

  useFarmerAsyncTask(
    "purchase-boost",
    () => {
      if (allData) {
        const hero = allData?.hero;
        const balance = hero?.coins;
        const currentBoostPercent = hero?.boostPercent;
        const availableBoosts = allData?.dbData.dbBoost.filter(
          (item) => item.price <= balance
        );

        const boost = availableBoosts.find((item) => item.price === 1000);

        if (boost && boost.boost > (currentBoostPercent || 0)) {
          return async function () {
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
          };
        }
      }
    },
    [allData]
  );
}
