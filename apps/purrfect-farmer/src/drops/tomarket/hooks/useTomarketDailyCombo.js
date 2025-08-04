import toast from "react-hot-toast";
import { useEffect } from "react";
import useTomarketClaimTaskMutation from "./useTomarketClaimTaskMutation";
import useTomarketHiddenTaskQuery from "./useTomarketHiddenTaskQuery";

export default function useTomarketDailyCombo() {
  const hiddenTaskQuery = useTomarketHiddenTaskQuery();
  const claimMutation = useTomarketClaimTaskMutation();

  const hiddenTask = hiddenTaskQuery.data?.[0];

  useEffect(() => {
    if (!hiddenTask || hiddenTask.status !== 0) return;

    (async function () {
      await claimMutation.mutateAsync(hiddenTask.taskId);
      toast.success("Tomarket - Daily Combo");
    })();
  }, [hiddenTask]);
}
