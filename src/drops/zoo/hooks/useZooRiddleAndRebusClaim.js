import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { delay } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

import useZooCheckQuestMutation from "./useZooCheckQuestMutation";
import useZooClaimQuestMutation from "./useZooClaimQuestMutation";
import useZooDataQueries from "./useZooDataQueries";

export default function useZooRiddleAndRebusClaim() {
  const checkRiddleMutation = useZooCheckQuestMutation("riddle");
  const claimRiddleMutation = useZooClaimQuestMutation("riddle");

  const checkRebusMutation = useZooCheckQuestMutation("rebus");
  const claimRebusMutation = useZooClaimQuestMutation("rebus");

  const dataQueries = useZooDataQueries();
  const [allData, afterData] = dataQueries.data;

  const queryClient = useQueryClient();

  useFarmerAsyncTask(
    "claim-riddle-and-rebus",
    () => {
      if ([allData, afterData].every(Boolean)) {
        /** Riddle */
        const riddle = allData.dbData.dbQuests.find((quest) =>
          quest.key.startsWith("riddle_")
        );

        /** Riddle Completion */
        const riddleCompletion = afterData.quests.find(
          (quest) => quest.key === riddle.key
        );

        /** Can Claim Riddle */
        const canClaimRiddle = riddle && !riddleCompletion;

        /** Rebus */
        const rebus = allData.dbData.dbQuests.find((quest) =>
          quest.key.startsWith("rebus_")
        );

        /** Rebus Completion */
        const rebusCompletion = afterData.quests.find(
          (quest) => quest.key === rebus.key
        );

        /** Can Claim Rebus */
        const canClaimRebus = rebus && !rebusCompletion;

        if (canClaimRiddle || canClaimRebus) {
          return async function () {
            /** Claim Riddle */
            if (canClaimRiddle) {
              try {
                await checkRiddleMutation.mutateAsync([
                  riddle.key,
                  riddle.checkData,
                ]);

                await claimRiddleMutation
                  .mutateAsync([riddle.key, riddle.checkData])
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
                toast.success("Riddle Claimed Successfully!");

                /** Delay */
                await delay(1000);
              } catch {
                /** Show Error Message */
                toast.error("Failed to Claim Riddle!");
              }
            }

            /** Claim Rebus */
            if (canClaimRebus) {
              try {
                await checkRebusMutation.mutateAsync([
                  rebus.key,
                  rebus.checkData,
                ]);
                await claimRebusMutation
                  .mutateAsync([rebus.key, rebus.checkData])
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
                toast.success("Rebus Claimed Successfully!");

                /** Delay */
                await delay(1000);
              } catch {
                /** Show Error Message */
                toast.error("Failed to Claim Rebus!");
              }
            }
          };
        }
      }
    },
    [allData, afterData]
  );
}
