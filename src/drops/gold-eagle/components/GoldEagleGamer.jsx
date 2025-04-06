import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useProcessLock from "@/hooks/useProcessLock";
import { SlWallet } from "react-icons/sl";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import { useEffect } from "react";

import useGoldEagleClaimMutation from "../hooks/useGoldEagleClaimMutation";
import useGoldEagleTapMutation from "../hooks/useGoldEagleTapMutation";
import useGoldEagleTasksQuery from "../hooks/useGoldEagleTasksQuery";
import useGoldEagleUserProgressQuery from "../hooks/useGoldEagleUserProgressQuery";

export default memo(function GoldEagleGamer() {
  const { metaQuery } = useFarmerContext();
  const game = metaQuery.data;
  const process = useProcessLock("gold-eagle.game");

  const tapMutation = useGoldEagleTapMutation(game.hex);
  const claimMutation = useGoldEagleClaimMutation();
  const query = useGoldEagleUserProgressQuery();
  const tasksQuery = useGoldEagleTasksQuery();
  const pendingTasks = useMemo(
    () =>
      tasksQuery.data?.filter(
        (task) => task["task_type"] === "Sl8" && task["status"] !== "Completed"
      ),
    [tasksQuery.data]
  );
  const canClaimToSl8 = useMemo(
    () => tasksQuery.isSuccess && pendingTasks.length === 0,
    [tasksQuery.isSuccess, pendingTasks]
  );

  const energy = query.data?.["energy"] || 0;
  const weight = query.data?.["tap_weight"] || 0;

  const [, dispatchAndClaim] = useMirroredCallback(
    "gold-eagle.claim",
    () => {
      toast
        .promise(
          claimMutation.mutateAsync().then(() => query.refetch()),
          {
            loading: "Claiming....",
            success: "Claimed Successfully",
            error: "Failed to Claim!",
          }
        )
        .catch((e) =>
          toast.error(e.response?.data?.message || "Something went wrong!")
        );
    },
    [claimMutation.mutateAsync, query.refetch]
  );

  /** Auto Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (energy < 10) {
      process.stop();
      return;
    }

    /** Execute */
    process.execute(async function () {
      const percent = 90 + Math.floor(Math.random() * 9);
      const claim = Math.floor((energy * percent) / 100);
      const taps = Math.floor(claim / weight);

      /** Tap */
      await tapMutation.mutateAsync(taps);

      /** Toast */
      toast.success(`Tapped ${taps} coins!`);

      /** Refetch */
      await query.refetch();

      /** Stop */
      return true;
    });
  }, [process, energy, weight]);

  /** Auto-Game */
  useFarmerAutoProcess("game", process, [query.isLoading === false]);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "px-4 py-2 rounded-lg text-white font-bold",
          !process.started ? "bg-orange-600" : "bg-red-500"
        )}
      >
        {!process.started ? "Start Playing" : "Stop Playing"}
      </button>

      <button
        className={cn(
          "px-4 py-2 rounded-lg",
          "text-orange-500",
          "bg-orange-100 dark:bg-black",
          "font-bold flex justify-center items-center gap-2"
        )}
        onClick={() => dispatchAndClaim()}
      >
        <SlWallet className="w-4 h-4" /> Claim to SL8
      </button>

      {/* Status */}
      <p
        className={cn(
          "text-center flex justify-center items-center gap-2",
          tasksQuery.isPending
            ? "text-yellow-500"
            : tasksQuery.isError
            ? "text-red-500"
            : canClaimToSl8
            ? "text-green-500"
            : "text-yellow-500"
        )}
      >
        {tasksQuery.isPending ? (
          "Checking..."
        ) : tasksQuery.isError ? (
          "Error!"
        ) : canClaimToSl8 ? (
          <>Status: Claimable</>
        ) : (
          <>Pending Tasks ({pendingTasks.length})</>
        )}
      </p>
    </div>
  );
});
