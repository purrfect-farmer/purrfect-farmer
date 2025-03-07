import Slider from "@/components/Slider";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useMirroredState from "@/hooks/useMirroredState";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delayForSeconds } from "@/lib/utils";
import { memo } from "react";
import { useEffect, useMemo } from "react";

import useTomarketSpinMutation from "../hooks/useTomarketSpinMutation";
import useTomarketTicketsQuery from "../hooks/useTomarketTicketsQuery";

export default memo(function TomarketTickets() {
  const query = useTomarketTicketsQuery();
  const ticketsCount = useMemo(
    () => Number(query.data?.["ticket_spin_1"] || 0),
    [query.data]
  );

  const spinMutation = useTomarketSpinMutation();
  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useMirroredState(
    "tomarket.tickets.farming-speed",
    2
  );
  const process = useProcessLock("tomarket.tickets");

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (ticketsCount < 1) {
      process.stop();
      return;
    }

    // Execute the Process
    process.execute(async function () {
      /** Spin */
      try {
        await spinMutation.mutateAsync();
        await delayForSeconds(farmingSpeed);
      } catch {}

      /** Refetch Balance */
      try {
        await query.refetch();
      } catch {}
    });
  }, [process, ticketsCount, farmingSpeed]);

  /** Auto-Spin */
  useFarmerAutoProcess("tickets", !query.isLoading, process);

  return (
    <>
      {query.isPending ? (
        <div className="flex justify-center">Fetching Tickets...</div>
      ) : // Error
      query.isError ? (
        <div className="flex justify-center text-red-700">
          Failed to fetch tickets...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-center text-rose-100">
            {ticketsCount}
          </h3>

          {/* Auto Spin Button */}
          <button
            disabled={ticketsCount < 1}
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 font-bold rounded-lg disabled:opacity-50",
              process.started
                ? "bg-white text-red-500"
                : "bg-lime-500 text-black"
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
              trackClassName="bg-rose-200"
              rangeClassName="bg-rose-300"
              thumbClassName="bg-rose-300"
            />

            {/* Speed Display */}
            <div className="text-center">
              Spin Speed: <span className="text-rose-100">{farmingSpeed}s</span>
            </div>
          </div>

          {process.started ? (
            <div className="text-center">Working....</div>
          ) : null}
        </div>
      )}
    </>
  );
});
