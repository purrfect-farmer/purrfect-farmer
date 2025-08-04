import toast from "react-hot-toast";
import useFarmerAutoTask from "@/hooks/useFarmerAutoTask";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { delay } from "@/lib/utils";
import { memo } from "react";
import { useMemo } from "react";

import HrumFullscreenSpinner from "./HrumFullscreenSpinner";
import HrumTaskButton from "./HrumTaskButton";
import RiddleIcon from "../assets/images/riddle.jpg?format=webp&w=80";
import useHrumCheckQuestMutation from "../hooks/useHrumCheckQuestMutation";
import useHrumClaimQuestMutation from "../hooks/useHrumClaimQuestMutation";

export default memo(function HrumRiddleTask({ queries }) {
  const checkRiddleMutation = useHrumCheckQuestMutation("riddle");
  const claimRiddleMutation = useHrumClaimQuestMutation("riddle");
  const [allData, afterData] = queries.data;
  const { processNextTask } = useFarmerContext();

  /** Riddle */
  const riddle = useMemo(
    () =>
      allData.dbData.dbQuests.find((quest) => quest.key.startsWith("riddle_")),
    [allData]
  );

  /** Riddle Completion */
  const riddleCompletion = useMemo(
    () => afterData.quests.find((quest) => quest.key === riddle.key),
    [riddle, afterData]
  );

  /** No Riddle or Completed */
  const disabled = !riddle || riddleCompletion;

  const [claimRiddle, dispatchAndClaimRiddle] = useMirroredCallback(
    "hrum.claim-riddle",
    async () => {
      if (riddle && !disabled) {
        try {
          await checkRiddleMutation.mutateAsync([riddle.key, riddle.checkData]);
          await claimRiddleMutation.mutateAsync([riddle.key, riddle.checkData]);

          /** Show Success Message */
          toast.success("Riddle Claimed Successfully!");

          /** Refetch Queries */
          queries.query.forEach((query) => query.refetch());
        } catch {
          /** Show Error Message */
          toast.error("Failed to Claim Riddle!");
        }
      }

      /** Little Delay */
      await delay(500);

      /** Process Next Task */
      processNextTask();
    },
    [queries, riddle, disabled, toast, processNextTask]
  );

  /** Auto-Claim */
  useFarmerAutoTask(
    "daily.riddle",
    () => {
      claimRiddle();
    },
    []
  );

  return (
    <div className="flex flex-col gap-2">
      <HrumTaskButton
        disabled={disabled}
        onClick={() => dispatchAndClaimRiddle()}
        icon={RiddleIcon}
        title={"Riddle Of The Day"}
        reward={150}
      />

      <p className="p-4 text-white bg-purple-800 rounded-lg">
        <q>{riddle.desc}</q> - {riddle.checkData}
      </p>
      {checkRiddleMutation.isPending || claimRiddleMutation.isPending ? (
        <HrumFullscreenSpinner />
      ) : null}
    </div>
  );
});
