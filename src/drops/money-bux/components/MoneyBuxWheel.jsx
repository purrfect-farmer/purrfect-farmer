import Slider from "@/components/Slider";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredState from "@/hooks/useMirroredState";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay, delayForSeconds } from "@/lib/utils";
import { memo } from "react";
import { useEffect, useMemo } from "react";

import useMoneyBuxAddSpinForAdMutation from "../hooks/useMoneyBuxAddSpinForAdMutation";
import useMoneyBuxGenerateHashForAdMutation from "../hooks/useMoneyBuxGenerateHashForAdMutation";
import useMoneyBuxWheelQuery from "../hooks/useMoneyBuxWheelQuery";
import useMoneyBuxWheelSpinMutation from "../hooks/useMoneyBuxWheelSpinMutation";

export default memo(function MoneyBuxWheel() {
  const { updateQueryData, updateAuthQueryData } = useFarmerContext();
  const query = useMoneyBuxWheelQuery();
  const spins = useMemo(() => query.data?.spins || 0, [query.data]);

  const generateHashForAdMutation = useMoneyBuxGenerateHashForAdMutation();
  const addSpinForAdMutation = useMoneyBuxAddSpinForAdMutation();
  const spinMutation = useMoneyBuxWheelSpinMutation();
  const process = useProcessLock("money-box.wheel");

  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useMirroredState(
    "money-box.farming-speed",
    1
  );

  useFarmerAsyncTask(
    "refill-spins",
    async () => {
      const { viewedAds } = query.data;
      const watchAds = async () => {
        for (let i = viewedAds; i < 30; i++) {
          const { hash } = await generateHashForAdMutation.mutateAsync();
          const result = await addSpinForAdMutation.mutateAsync(hash);

          updateQueryData(["money-bux", "wheel"], (prev) => ({
            ...prev,
            ["spins"]: result["spins"],
            ["viewedAds"]: result["viewed_ads_today"],
          }));

          await delay(1000);
        }
      };

      if (viewedAds < 30) {
        await toast.promise(watchAds(), {
          loading: "Watching Wheel Ads",
          success: "Completed Wheel Ads",
          error: "Error!",
        });
      }
    },
    [query.data]
  );

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (spins < 1) {
      process.stop();
      return;
    }

    // Execute Process
    process.execute(async function () {
      /** Spin */
      try {
        await spinMutation.mutateAsync({
          type: "get_sector",
        });

        const result = await spinMutation.mutateAsync({
          type: "get_prize",
        });

        updateAuthQueryData((prev) => ({
          ...prev,
          ["main_b"]: result["main_b"] || prev["main_b"],
        }));

        updateQueryData(["money-bux", "wheel"], (prev) => ({
          ...prev,
          ["spins"]: result["spins"] || prev["spins"],
        }));
      } catch {}

      /** Delay */
      await delayForSeconds(farmingSpeed);
    });
  }, [process, spins, farmingSpeed]);

  /** Auto-Spin */
  useFarmerAutoProcess("wheel", process, [query.isLoading === false]);

  return (
    <div>
      {query.isPending ? (
        <div className="flex justify-center">Fetching Wheel...</div>
      ) : // Error
      query.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch wheel...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-center text-orange-500">
            {spins}
          </h3>

          {/* Auto Spin Button */}
          <button
            disabled={spins < 1}
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 text-white rounded-lg disabled:opacity-50",
              process.started ? "bg-red-500" : "bg-orange-500",
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
              trackClassName="bg-orange-200"
              rangeClassName="bg-orange-500"
              thumbClassName="bg-orange-500"
            />

            {/* Speed Display */}
            <div className="text-center">
              Spinning Speed:{" "}
              <span className="text-orange-500">{farmingSpeed}s</span>
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
