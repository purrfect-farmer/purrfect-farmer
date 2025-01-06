import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { CgSpinner } from "react-icons/cg";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";
import { useState } from "react";

import useFunaticGameQuery from "../hooks/useFunaticGameQuery";
import useFunaticTapMutation from "../hooks/useFunaticTapMutation";

export default memo(function FunaticGamer() {
  const process = useProcessLock("funatic.game");
  const gameQuery = useFunaticGameQuery();
  const tapMutation = useFunaticTapMutation();

  const energy = gameQuery.data?.energy;
  const currentEnergyBalance = energy?.currentEnergyBalance || 0;

  const [balance, setBalance] = useState(null);

  /** Reset Balance */
  useEffect(() => {
    setBalance(null);
  }, [process.started]);

  /** Auto Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (balance === null) {
      setBalance(currentEnergyBalance);
      return;
    } else if (balance < 1) {
      process.stop();
      return;
    }

    (async function () {
      /** Lock */
      process.lock();

      /** Calculate Amount to Collect */
      const toCollect = Math.min(balance, 8 + Math.floor(Math.random() * 3));

      /** Remaining */
      const remaining = balance - toCollect;

      /** Tap */
      await tapMutation.mutateAsync(toCollect);

      /** Toast */
      toast.dismiss();
      toast.success(`Collected ${toCollect} taps!`);

      /** Update Balance */
      setBalance((prev) => prev - toCollect);

      /** Delay */
      await delay(500);

      /** Refetch */
      if (remaining < 1) {
        await gameQuery.refetch();
      }

      /** Stop Process */
      process.unlock();
    })();
  }, [process, balance]);

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

          <div className="font-bold text-center text-indigo-500">
            Left: {currentEnergyBalance}
          </div>
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
});
