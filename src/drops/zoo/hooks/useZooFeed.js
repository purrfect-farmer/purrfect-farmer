import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { useQueryClient } from "@tanstack/react-query";

import useZooBuyAutoFeedMutation from "./useZooBuyAutoFeedMutation";
import useZooShouldBuyFeed from "./useZooShouldBuyFeed";

export default function useZooFeed() {
  const queryClient = useQueryClient();
  const buyAutoFeedMutation = useZooBuyAutoFeedMutation();
  const shouldPurchase = useZooShouldBuyFeed();

  useFarmerAsyncTask(
    "feed",
    () => {
      return async function () {
        if (shouldPurchase) {
          /** Buy Feed */
          const result = await buyAutoFeedMutation.mutateAsync();

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
          toast.success("Purchased Feed");
        }
      };
    },
    [shouldPurchase]
  );
}
