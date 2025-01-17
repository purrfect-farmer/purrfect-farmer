import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";

import useGoldEagleTapMutation from "../hooks/useGoldEagleTapMutation";
import useGoldEagleUserProgressQuery from "../hooks/useGoldEagleUserProgressQuery";

export default memo(function GoldEagleGamer() {
  const { game } = useFarmerContext();
  const process = useProcessLock("gold-eagle.game");

  const tapMutation = useGoldEagleTapMutation(game.hex);
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

      const percent = 80 + Math.floor(Math.random() * 18);
      const taps = Math.floor((energy * percent) / 100);
      const available = Math.floor(energy - taps);

      /** Tap */
      await tapMutation.mutateAsync({
        taps,
        available,
      });

      /** Toast */
      toast.success(`Tapped ${taps} coins!`);

      /** Refetch */
      await query.refetch();

      /** Unlock */
      process.stop();
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
          !process.started ? "bg-orange-600" : "bg-red-500"
        )}
      >
        {!process.started ? "Start Playing" : "Stop Playing"}
      </button>
    </div>
  );
});
