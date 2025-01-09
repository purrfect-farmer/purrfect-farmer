import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { CgSpinner } from "react-icons/cg";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";

import useFunaticGameQuery from "../hooks/useFunaticGameQuery";
import useFunaticTapMutation from "../hooks/useFunaticTapMutation";
import { useQueryClient } from "@tanstack/react-query";

export default memo(function FunaticGamer() {
  const process = useProcessLock("funatic.game");
  const queryClient = useQueryClient();
  const gameQuery = useFunaticGameQuery();
  const tapMutation = useFunaticTapMutation();

  const energy = gameQuery.data?.energy?.currentEnergyBalance || 0;

  /** Auto Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (energy < 1) {
      process.stop();
      return;
    }

    (async function () {
      /** Lock */
      process.lock();

      /** Calculate Amount to Collect */
      const taps = Math.min(energy, 8 + Math.floor(Math.random() * 3));

      /** Tap */
      await tapMutation.mutateAsync(taps);

      /** Toast */
      toast.dismiss();
      toast.success(`Collected ${taps} taps!`);

      /** Update Balance */
      queryClient.setQueryData(["funatic", "game"], (prev) => ({
        ...prev,
        energy: {
          ...prev.energy,
          currentEnergyBalance: prev.energy.currentEnergyBalance - taps,
        },
      }));

      /** Delay */
      await delay(500);

      /** Stop Process */
      process.unlock();
    })();
  }, [process, energy]);

  /** Auto-Game */
  useFarmerAutoProcess("game", gameQuery.isLoading === false, process);

  return (
    <div className="flex flex-col gap-2 p-4">
      {gameQuery.isSuccess ? (
        <>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "px-4 py-2 rounded-lg text-white font-bold",
              !process.started ? "bg-purple-500" : "bg-red-500"
            )}
          >
            {!process.started ? "Start Playing" : "Stop Playing"}
          </button>

          {/* Energy */}
          <div className="font-bold text-center text-indigo-500">
            Energy: {energy}
          </div>
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
});
