import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { SlWallet } from "react-icons/sl";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";

import useGoldEagleClaimMutation from "../hooks/useGoldEagleClaimMutation";
import useGoldEagleRefillMutation from "../hooks/useGoldEagleRefillMutation";
import useGoldEagleTasksQuery from "../hooks/useGoldEagleTasksQuery";
import useGoldEagleUserProgressQuery from "../hooks/useGoldEagleUserProgressQuery";

export default memo(function GoldEagleGamer() {
  const refillMutation = useGoldEagleRefillMutation();
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

  /** Refill */
  useFarmerAsyncTask(
    "refill",
    async function () {
      const energy = query.data["energy"];
      const maxEnergy = query.data["max_energy"];

      /** Refill */
      if (energy < maxEnergy * 0.2) {
        try {
          /** Refill */
          await refillMutation.mutateAsync();

          /** Toast */
          toast.success("Refilled Energy!");

          /** Refetch */
          await query.refetch();
        } catch {}
      }
    },
    [query.data]
  );

  return (
    <div className="flex flex-col gap-2">
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
