import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { CgSpinner } from "react-icons/cg";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";

import useCEXTapMutation from "../hooks/useCEXTapMutation";
import { useQueryClient } from "@tanstack/react-query";
import useCEXUserQuery from "../hooks/useCEXUserQuery";

export default memo(function CEXGamer() {
  const process = useProcessLock("cex.game");
  const queryClient = useQueryClient();
  const userQuery = useCEXUserQuery();
  const tapMutation = useCEXTapMutation();

  const energy = Number(userQuery.data?.multiTapsEnergy || 0);

  /** Auto Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (energy < 1) {
      process.stop();
      return;
    }

    /** Execute */
    process.execute(async function () {
      /** Calculate Amount to Collect */

      const percent = 60 + Math.floor(Math.random() * 20);
      const taps = Math.floor((energy * percent) / 100);
      const balance = energy - taps;

      /** Tap */
      await tapMutation.mutateAsync({
        tapsToClaim: taps,
        tapsEnergy: balance,
      });

      /** Toast */
      toast.dismiss();
      toast.success(`Collected ${taps} taps!`);

      /** Update Balance */
      queryClient.setQueryData(["cex", "user"], (prev) => ({
        ...prev,
        multiTapsEnergy: prev.multiTapsEnergy - taps,
      }));

      /** Delay */
      await delay(500);

      /** Stop */
      return true;
    });
  }, [process, energy]);

  /** Auto-Game */
  useFarmerAutoProcess("game", userQuery.isLoading === false, process);

  return (
    <div className="flex flex-col gap-2 p-4">
      {userQuery.isSuccess ? (
        <>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "px-4 py-2 rounded-lg text-white font-bold",
              !process.started ? "bg-orange-500" : "bg-red-500"
            )}
          >
            {!process.started ? "Start Playing" : "Stop Playing"}
          </button>

          {/* Energy */}
          <div className="font-bold text-center text-sky-500">
            Energy: {energy}
          </div>
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
});
