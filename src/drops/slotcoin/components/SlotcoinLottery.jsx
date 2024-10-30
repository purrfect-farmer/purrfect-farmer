import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { cn, delayForSeconds } from "@/lib/utils";
import { useCallback, useEffect, useMemo } from "react";

import EnergyIcon from "../assets/images/energy.png?format=webp&w=80";
import useSlotcoinInfoQuery from "../hooks/useSlotcoinInfoQuery";
import useSlotcoinLotteryMutation from "../hooks/useSlotcoinLotteryMutation";
import Slider from "@/components/Slider";
import useSocketState from "@/hooks/useSocketState";

export default function SlotcoinLottery() {
  const query = useSlotcoinInfoQuery();
  const energy = query.data?.user?.spins || 0;
  const maxEnergy = query.data?.user?.["max_spins"] || 0;

  const spinMutation = useSlotcoinLotteryMutation();
  const process = useProcessLock();

  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "slotcoin.farming-speed",
    2
  );

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
        action: "slotcoin.spin",
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
        "slotcoin.spin": (command) => {
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

    if (energy < 1) {
      process.stop();
      return;
    }

    (async function () {
      // Lock Process
      process.lock();

      /** Spin */
      try {
        await spinMutation.mutateAsync();
      } catch {}

      /** Refetch Balance */
      try {
        await query.refetch();
      } catch {}

      /** Delay */
      await delayForSeconds(farmingSpeed);

      // Release Lock
      process.unlock();
    })();
  }, [process, energy, farmingSpeed]);

  return (
    <div className="p-4">
      {query.isPending ? (
        <div className="flex justify-center">Fetching Spins...</div>
      ) : // Error
      query.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch lottery...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-center text-purple-500">
            <img src={EnergyIcon} className="inline w-5" /> {energy} /{" "}
            {maxEnergy}
          </h3>

          {/* Auto Spin Button */}
          <button
            disabled={energy < 1}
            onClick={() => dispatchAndToggleAutoSpin(!process.started)}
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
              onValueChange={([value]) =>
                dispatchAndSetFarmingSpeed(Math.max(1, value))
              }
              trackClassName="bg-purple-200"
              rangeClassName="bg-purple-500"
              thumbClassName="bg-purple-500"
            />

            {/* Speed Display */}
            <div className="text-center">
              Spinning Speed:{" "}
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
