import toast from "react-hot-toast";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { useCallback } from "react";
import { useMemo } from "react";

import HrumFullscreenSpinner from "./HrumFullscreenSpinner";
import HrumTaskButton from "./HrumTaskButton";
import RiddleIcon from "../assets/images/riddle.jpg?format=webp&w=80";
import useHrumCheckQuestMutation from "../hooks/useHrumCheckQuestMutation";
import useHrumClaimQuestMutation from "../hooks/useHrumClaimQuestMutation";

export default function HrumRiddleTask({ queries }) {
  const checkRiddleMutation = useHrumCheckQuestMutation("riddle");
  const claimRiddleMutation = useHrumClaimQuestMutation("riddle");
  const [allData, afterData] = queries.data;

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

  const [claimRiddle, dispatchAndClaimRiddle] = useSocketDispatchCallback(
    /** Configure Settings */
    useCallback(async () => {
      if (!riddle || disabled) return;

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
    }, [queries, riddle, disabled, toast]),

    /** Dispatch */
    useCallback(
      (socket) =>
        socket.dispatch({
          action: "hrum.riddle",
        }),
      []
    )
  );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "hrum.riddle": () => {
          claimRiddle();
        },
      }),
      [claimRiddle]
    )
  );

  return (
    <>
      <HrumTaskButton
        disabled={disabled}
        onClick={dispatchAndClaimRiddle}
        icon={RiddleIcon}
        title={"Riddle Of The Day"}
        reward={150}
      />
      {checkRiddleMutation.isPending || claimRiddleMutation.isPending ? (
        <HrumFullscreenSpinner />
      ) : null}
    </>
  );
}
