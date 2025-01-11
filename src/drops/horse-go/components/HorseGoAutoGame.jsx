import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";

import HorseGoButton from "./HorseGoButton";
import useHorseGoUserQuery from "../hooks/useHorseGoUserQuery";
import useHorseGoRaceMutation from "../hooks/useHorseGoRaceMutation";
import { useQueryClient } from "@tanstack/react-query";
import useSocketState from "@/hooks/useSocketState";

const GAME_DURATION = 5_000;

export default memo(function HorseGoAutoGame() {
  const process = useProcessLock("horse-go.game");
  const userQuery = useHorseGoUserQuery();

  const raceMutation = useHorseGoRaceMutation();

  const queryClient = useQueryClient();

  const [enforceWin, setEnforceWin, dispatchAndSetEnforceWin] = useSocketState(
    "horse-go.enforce-win",
    false
  );
  const energy = userQuery.data?.energyPoints || 0;

  /** Play Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (energy < 1) {
      process.stop();
      return;
    }

    (async function () {
      /** Lock Process */
      process.lock();

      try {
        /** Bid */
        const result =
          enforceWin || Math.floor(Math.random() * 2) ? "WIN" : "LOSE";
        const priceChange = Math.floor(Math.random() * 2) ? "LONG" : "SHORT";

        /** Delay */
        await delay(GAME_DURATION, true);

        /** Submit */
        const data = await raceMutation.mutateAsync({
          priceChange,
          result,
        });

        /** Toast */
        if (result === "WIN") {
          toast.success(`HorseGo - Win (${priceChange})`);
        } else {
          toast.error(`HorseGo - Lose (${priceChange})`);
        }

        /** Update Data */
        queryClient.setQueryData(["horse-go", "user"], () => data);
      } catch {}

      /** Release Lock */
      process.unlock();
    })();
  }, [process, energy, enforceWin]);

  /** Auto-Play Game */
  useFarmerAutoProcess(
    "game",
    [userQuery.isLoading].every((status) => status === false),
    process
  );

  return (
    <div className="flex flex-col gap-2 py-2">
      <HorseGoButton
        color={process.started ? "danger" : "primary"}
        onClick={() => process.dispatchAndToggle(!process.started)}
        disabled={energy < 1}
      >
        {process.started ? "Stop" : "Start"}
      </HorseGoButton>

      <button
        className={cn(
          enforceWin ? "text-lime-500 font-bold" : null,
          "mx-auto my-2"
        )}
        onClick={() => dispatchAndSetEnforceWin((prev) => prev === false)}
      >
        Enforce Win
      </button>
    </div>
  );
});
