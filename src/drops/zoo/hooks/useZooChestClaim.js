import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { useQueryClient } from "@tanstack/react-query";

import useZooClaimQuestMutation from "./useZooClaimQuestMutation";
import useZooDataQueries from "./useZooDataQueries";

export default function useZooChestClaim() {
  const claimChestMutation = useZooClaimQuestMutation("chest");

  const dataQueries = useZooDataQueries();
  const [allData, afterData] = dataQueries.data;

  const queryClient = useQueryClient();

  useFarmerAsyncTask(
    "claim-chest",
    () => {
      if ([allData, afterData].every(Boolean)) {
        /** Chest */
        const chest = allData.dbData.dbQuests.find((quest) =>
          quest.key.startsWith("chest_")
        );

        /** Chest Completion */
        const chestCompletion = afterData.quests.find(
          (quest) => quest.key === chest?.key
        );

        /** Can Claim Chest */
        const canClaimChest = chest && !chestCompletion;

        /** Claim Chest */
        if (canClaimChest) {
          return async function () {
            try {
              await claimChestMutation
                .mutateAsync([chest.key])
                .then((result) => {
                  /** Update All Data */
                  queryClient.setQueryData(["zoo", "all"], (prev) => {
                    return {
                      ...prev,
                      hero: result.hero,
                    };
                  });

                  /** Update After Data */
                  queryClient.setQueryData(["zoo", "after"], (prev) => {
                    return {
                      ...prev,
                      quests: result.quests,
                    };
                  });
                });

              /** Show Success Message */
              toast.success("Chest Claimed Successfully!");
            } catch {
              /** Show Error Message */
              toast.error("Failed to Claim Chest!");
            }
          };
        }
      }
    },
    [allData, afterData]
  );
}
