import Slider from "@/components/Slider";
import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketState from "@/hooks/useSocketState";
import { cn, delayForSeconds, logNicely } from "@/lib/utils";
import { useEffect, useMemo } from "react";

import useDreamCoinClaimRaidRewardMutation from "../hooks/useDreamCoinClaimRaidRewardMutation";
import useDreamCoinGetCaseMutation from "../hooks/useDreamCoinGetCaseMutation";
import useDreamCoinOpenCaseMutation from "../hooks/useDreamCoinOpenCaseMutation";
import useDreamCoinSpinMutation from "../hooks/useDreamCoinSpinMutation";
import useDreamCoinUserQuery from "../hooks/useDreamCoinUserQuery";

export default function DreamCoinLottery() {
  const query = useDreamCoinUserQuery();
  const multiplier = useMemo(
    () => (query.data ? Math.max(...query.data.availableSpinMultipliers) : 1),
    [query.data]
  );
  const energy = useMemo(
    () => Number(query.data?.energy?.current || 0),
    [query.data]
  );

  const spinMutation = useDreamCoinSpinMutation();
  const claimRaidMutation = useDreamCoinClaimRaidRewardMutation();
  const getCaseMutation = useDreamCoinGetCaseMutation();
  const openCaseMutation = useDreamCoinOpenCaseMutation();
  const process = useProcessLock("dreamcoin.lottery");

  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "dreamcoin.farming-speed",
    1
  );

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (energy < multiplier) {
      process.stop();
      return;
    }

    (async function () {
      // Lock Process
      process.lock();

      /** Spin */
      try {
        const { slotRewards } = await spinMutation.mutateAsync(multiplier);

        for (const reward of slotRewards) {
          switch (reward.rewardType) {
            case "Gift":
              /** Toast */
              toast.success("DreamCoin - Gift");
              break;
            case "Raid":
              await claimRaidMutation.mutateAsync(
                1 + Math.floor(Math.random() * 4)
              );

              /** Toast */
              toast.success("DreamCoin - Raid");
              break;

            case "FreeCase":
              const freeCase = await getCaseMutation.mutateAsync(
                reward.freeCase
              );

              /** Log It */
              logNicely("DREAMCOIN FREECASE", freeCase);

              /** Open Case */
              await openCaseMutation(reward.freeCase);

              /** Toast */
              toast.success("DreamCoin - FreeCase");
              break;
          }
        }
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
  }, [process, energy, multiplier, farmingSpeed]);

  /** Auto-Spin */
  useFarmerAutoProcess("lottery", !query.isLoading, process.start);

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
          {/* Auto Spin Button */}
          <button
            disabled={energy < 1}
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 text-white rounded-lg disabled:opacity-50",
              process.started ? "bg-red-500" : "bg-pink-500",
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
              trackClassName="bg-pink-200"
              rangeClassName="bg-pink-500"
              thumbClassName="bg-pink-500"
            />

            {/* Speed Display */}
            <div className="text-center">
              Spinning Speed:{" "}
              <span className="text-pink-500">{farmingSpeed}s</span>
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