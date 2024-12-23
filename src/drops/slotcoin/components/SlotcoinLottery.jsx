import Slider from "@/components/Slider";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketState from "@/hooks/useSocketState";
import { cn, delayForSeconds } from "@/lib/utils";
import { memo } from "react";
import { useEffect, useMemo } from "react";

import EnergyIcon from "../assets/images/energy.png?format=webp&w=80";
import useSlotcoinInfoQuery from "../hooks/useSlotcoinInfoQuery";
import useSlotcoinLotteryMutation from "../hooks/useSlotcoinLotteryMutation";

export default memo(function SlotcoinLottery() {
  const query = useSlotcoinInfoQuery();
  const bid = useMemo(() => Number(query.data?.user?.bid || 0), [query.data]);
  const energy = useMemo(
    () => Number(query.data?.user?.spins || 0),
    [query.data]
  );

  const maxEnergy = useMemo(
    () => Number(query.data?.user?.["max_spins"] || 0),
    [query.data]
  );

  const spinMutation = useSlotcoinLotteryMutation();
  const process = useProcessLock("slotcoin.lottery");

  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "slotcoin.farming-speed",
    1
  );

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (energy < bid) {
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
  }, [process, energy, bid, farmingSpeed]);

  /** Auto-Spin */
  useFarmerAutoProcess("lottery", !query.isLoading, process);

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
});
