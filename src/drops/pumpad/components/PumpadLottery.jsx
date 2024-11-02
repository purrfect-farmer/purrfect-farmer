import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { cn, delayForSeconds } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";

import usePumpadLotteryMutation from "../hooks/usePumpadLotteryMutation";
import usePumpadLotteryQuery from "../hooks/usePumpadLotteryQuery";
import useSocketState from "@/hooks/useSocketState";
import Slider from "@/components/Slider";

export default function PumpadLottery() {
  const query = usePumpadLotteryQuery();
  const drawCount = query.data?.["draw_count"] || 0;

  const spinMutation = usePumpadLotteryMutation();
  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "pumpad.farming-speed",
    2
  );
  const process = useProcessLock();

  /** Handle button click */
  const [toggleAutoSpin, dispatchAndToggleAutoSpin] = useSocketDispatchCallback(
    /** Main */
    useCallback(
      (status) => {
        process.toggle(status);
      },
      [process.toggle]
    ),

    /** Dispatch */
    useCallback((socket, status) => {
      socket.dispatch({
        action: "pumpad.spin",
        data: {
          status,
        },
      });
    }, [])
  );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "pumpad.spin": (command) => {
          toggleAutoSpin(command.data.status);
        },
      }),
      [toggleAutoSpin]
    )
  );

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (!drawCount) {
      process.stop();
      return;
    }

    (async function () {
      // Lock Process
      process.lock();

      /** Spin */
      try {
        await spinMutation.mutateAsync();
        await delayForSeconds(farmingSpeed);
      } catch {}

      /** Refetch Balance */
      try {
        await query.refetch();
      } catch {}

      // Release Lock
      process.unlock();
    })();
  }, [process, drawCount, farmingSpeed]);

  return (
    <div className="p-4">
      {query.isPending ? (
        <div className="flex justify-center">Fetching Lottery...</div>
      ) : // Error
      query.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch lottery...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-bold text-center">{drawCount}</h3>
          <p className="text-center text-neutral-500">Lottery</p>

          {/* Auto Spin Button */}
          <button
            disabled={!drawCount}
            onClick={() => dispatchAndToggleAutoSpin(!process.started)}
            className={cn(
              "p-2 text-black rounded-lg disabled:opacity-50",
              process.started ? "bg-red-500" : "bg-pumpad-green-500",
              "font-bold"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {/* Farming Speed */}
          <div className="flex flex-col gap-1">
            {/* Speed Control */}
            <Slider
              value={[farmingSpeed]}
              min={0}
              max={5}
              step={0.5}
              onValueChange={([value]) =>
                dispatchAndSetFarmingSpeed(Math.max(0.5, value))
              }
              trackClassName="bg-pumpad-green-400"
              rangeClassName="bg-pumpad-green-700"
              thumbClassName="bg-pumpad-green-700"
            />

            {/* Speed Display */}
            <div className="text-center">
              Spinning Speed:{" "}
              <span className="text-pumpad-green-800">{farmingSpeed}s</span>
            </div>
          </div>

          {process.started ? (
            <div className="text-center">Working....</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
