import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";
import useGoldEagleUserProgressQuery from "../hooks/useGoldEagleUserProgressQuery";
import useGoldEagleTapMutation from "../hooks/useGoldEagleTapMutation";
import toast from "react-hot-toast";

export default memo(function GoldEagleGamer() {
  const process = useProcessLock("gold-eagle.game");

  const tapMutation = useGoldEagleTapMutation();
  const query = useGoldEagleUserProgressQuery();

  const energy = query.data?.["energy"] || 0;

  /** Auto Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (energy < 10) {
      process.stop();
      return;
    }

    (async function () {
      /** Lock */
      process.lock();

      /** Tap */
      await tapMutation.mutateAsync(energy);

      /** Toast */
      toast.success(`Tapped ${energy} coins!`);

      /** Refetch */
      await query.refetch();

      /** Unlock */
      process.unlock();
    })();
  }, [process, energy]);

  /** Auto-Game */
  useFarmerAutoProcess("game", !query.isLoading, process);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "px-4 py-2 rounded-lg text-white font-bold",
          !process.started ? "bg-yellow-600" : "bg-red-500"
        )}
      >
        {!process.started ? "Start Playing" : "Stop Playing"}
      </button>
    </div>
  );
});
