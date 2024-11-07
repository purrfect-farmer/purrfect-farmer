import Slider from "@/components/Slider";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketState from "@/hooks/useSocketState";
import { cn, delayForSeconds } from "@/lib/utils";
import { useEffect, useMemo } from "react";

import useSlotcoinInfoQuery from "../hooks/useSlotcoinInfoQuery";
import useSlotcoinDailySpinMutation from "../hooks/useSlotcoinDailySpinMutation";
import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function SlotcoinTickets() {
  const { processNextTask } = useFarmerContext();
  const query = useSlotcoinInfoQuery();
  const ticketsCount = useMemo(
    () => Number(query.data?.["user"]?.["daily_roulette_count"] || 0),
    [query.data]
  );

  const spinMutation = useSlotcoinDailySpinMutation();
  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "slotcoin.tickets.farming-speed",
    2
  );
  const process = useProcessLock("slotcoin.tickets.spin");

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (ticketsCount < 1) {
      processNextTask();
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
  }, [process, ticketsCount, farmingSpeed, processNextTask]);

  /** Auto-Spin */
  useFarmerAutoTask(
    "tickets",
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
        <div className="flex justify-center">Fetching Tickets...</div>
      ) : // Error
      query.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch tickets...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-center text-purple-500">
            {ticketsCount}
          </h3>

          {/* Auto Spin Button */}
          <button
            disabled={ticketsCount < 1}
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 text-white rounded-lg disabled:opacity-50",
              process.started ? "bg-red-500" : "bg-purple-500",
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
              trackClassName="bg-purple-200"
              rangeClassName="bg-purple-500"
              thumbClassName="bg-purple-500"
            />

            {/* Speed Display */}
            <div className="text-center">
              Spin Speed:{" "}
              <span className="text-purple-500">{farmingSpeed}s</span>
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
