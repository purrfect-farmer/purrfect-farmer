import useProcessLock from "@/hooks/useProcessLock";
import { cn, delayForSeconds } from "@/lib/utils";
import { useEffect } from "react";

import usePumpadLotteryMutation from "../hooks/usePumpadLotteryMutation";
import usePumpadLotteryQuery from "../hooks/usePumpadLotteryQuery";
import useSocketState from "@/hooks/useSocketState";
import Slider from "@/components/Slider";
import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function PumpadLottery() {
  const { processNextTask } = useFarmerContext();
  const query = usePumpadLotteryQuery();
  const drawCount = query.data?.["draw_count"] || 0;

  const spinMutation = usePumpadLotteryMutation();
  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "pumpad.lottery.farming-speed",
    2
  );
  const process = useProcessLock("pumpad.lottery.spin");

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (drawCount < 1) {
      process.stop();
      processNextTask();
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
  }, [process, drawCount, farmingSpeed, processNextTask]);

  /** Auto-Spin */
  useFarmerAutoTask(
    "lottery",
    () => {
      if (query.isSuccess) {
        process.start();
      }
    },
    [query.isSuccess, process.start]
  );

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
          <h3 className="text-xl font-bold text-center">{drawCount}</h3>

          {/* Auto Spin Button */}
          <button
            disabled={drawCount < 1}
            onClick={() => process.dispatchAndToggle(!process.started)}
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
