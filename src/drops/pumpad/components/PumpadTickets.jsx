import Slider from "@/components/Slider";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useMirroredState from "@/hooks/useMirroredState";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delayForSeconds } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";

import usePumpadBetMutation from "../hooks/usePumpadBetMutation";
import usePumpadTicketsQuery from "../hooks/usePumpadTicketsQuery";

export default memo(function PumpadTickets() {
  const query = usePumpadTicketsQuery();
  const ticketsCount = query.data?.["number_of_tickets"] || 0;

  const betMutation = usePumpadBetMutation();
  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useMirroredState(
    "pumpad.tickets.farming-speed",
    2
  );
  const process = useProcessLock("pumpad.tickets");

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
        await betMutation.mutateAsync();
        await delayForSeconds(farmingSpeed);
      } catch (e) {
        console.error(e);
      }

      /** Refetch Balance */
      try {
        await query.refetch();
      } catch (e) {
        console.error(e);
      }
    });
  }, [process, ticketsCount, farmingSpeed]);

  /** Auto-Spin */
  useFarmerAutoProcess("tickets", process, [query.isLoading === false]);

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
          <h3 className="text-xl font-bold text-center">{ticketsCount}</h3>

          {/* Auto Spin Button */}
          <button
            disabled={ticketsCount < 1}
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
              Bet Speed:{" "}
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
});
