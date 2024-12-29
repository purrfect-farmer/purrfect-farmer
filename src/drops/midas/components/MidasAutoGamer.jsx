import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { CgSpinner } from "react-icons/cg";
import { cn, delayForSeconds } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";

import useMidasUserQuery from "../hooks/useMidasUserQuery";
import useMidasPlayGameMutation from "../hooks/useMidasPlayGameMutation";

export default memo(function Midas() {
  const process = useProcessLock("midas.game");
  const userQuery = useMidasUserQuery();

  const tickets = userQuery.data?.tickets || 0;

  const playGameMutation = useMidasPlayGameMutation();

  /** Auto Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (tickets < 1) {
      process.stop();
      return;
    }

    (async function () {
      /** Lock */
      process.lock();

      if (!process.controller.signal.aborted) {
        /** Delay */
        await delayForSeconds(7);

        /** Main Coins */
        const { points } = await playGameMutation.mutateAsync();

        /** Toast */
        toast.success(`Collected ${points} points!`);

        await userQuery.refetch();
      }

      /** Unlock */
      process.unlock();
    })();
  }, [process, tickets]);

  /** Auto-Game */
  useFarmerAutoProcess("game", !userQuery.isLoading, process);

  return (
    <div className="flex flex-col gap-2">
      {userQuery.isSuccess ? (
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
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
});
