import Slider from "@/components/Slider";
import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/drops/notpixel/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketState from "@/hooks/useSocketState";
import { CgSpinner } from "react-icons/cg";
import { cn, delayForSeconds } from "@/lib/utils";
import { useEffect } from "react";

import useYescoinCollectCoinMutation from "../hooks/useYescoinCollectCoinMutation";
import useYescoinCollectSpecialBoxCoinMutation from "../hooks/useYescoinCollectSpecialBoxCoinMutation";
import useYescoinGameInfoQuery from "../hooks/useYescoinGameInfoQuery";
import useYescoinGameSpecialBoxInfoQuery from "../hooks/useYescoinGameSpecialBoxInfoQuery";

export default function YescoinGamer() {
  const { zoomies } = useFarmerContext();
  const process = useProcessLock("yescoin.game");
  const gameInfoQuery = useYescoinGameInfoQuery();
  const specialBoxInfoQuery = useYescoinGameSpecialBoxInfoQuery({
    enabled: process.started,
  });

  const specialBox = specialBoxInfoQuery.data;
  const coinLeft = gameInfoQuery.data?.coinPoolLeftCount;

  const collectCoinMutation = useYescoinCollectCoinMutation();
  const collectSpecialBoxMutation = useYescoinCollectSpecialBoxCoinMutation();

  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "yescoin.farming-speed",
    3
  );

  /** Auto Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (coinLeft <= 150) {
      process.stop();

      return;
    }

    (async function () {
      /** Lock */
      process.lock();

      const toCollect = Math.min(
        coinLeft,
        150 + Math.floor(Math.random() * 50)
      );

      if (!process.controller.signal.aborted) {
        /** Main Coins */
        await collectCoinMutation.mutateAsync(toCollect);
        toast.success(`Collected ${toCollect} coins!`);

        /** Special Box */
        if (specialBox?.autoBox) {
          const { boxType, specialBoxTotalCount } = specialBox.autoBox;
          const coinCount = Math.floor((90 * specialBoxTotalCount) / 100);
          await collectSpecialBoxMutation.mutateAsync({
            boxType,
            coinCount,
          });

          toast.success(`Special - collected ${coinCount} coins!`);
        }

        await delayForSeconds(farmingSpeed);

        await gameInfoQuery.refetch();
        await specialBoxInfoQuery.refetch();
      }

      if (zoomies.enabled) {
        /** Stop Process */
        process.stop();
      } else {
        /** Unlock */
        process.unlock();
      }
    })();
  }, [process, zoomies.enabled, coinLeft, specialBox, farmingSpeed]);

  /** Auto-Game */
  useFarmerAutoProcess("game", !gameInfoQuery.isLoading, process.start);

  return (
    <div className="flex flex-col gap-2">
      {gameInfoQuery.isSuccess ? (
        <>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "px-4 py-2 rounded-lg text-white font-bold",
              !process.started ? "bg-purple-500" : "bg-red-500"
            )}
          >
            {!process.started ? "Start Playing" : "Stop Playing"}
          </button>

          {/* Farming Speed */}
          <div className="flex flex-col gap-1">
            {/* Speed Control */}
            <Slider
              value={[farmingSpeed]}
              min={0}
              max={15}
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
              Game Speed:{" "}
              <span className="text-purple-500">{farmingSpeed}s</span>
            </div>
          </div>

          <div className="font-bold text-center text-orange-500">
            Left: {coinLeft}
          </div>
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
}
