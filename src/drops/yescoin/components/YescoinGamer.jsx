import toast from "react-hot-toast";
import useProcessLock from "@/hooks/useProcessLock";
import { CgSpinner } from "react-icons/cg";
import { cn, delay } from "@/lib/utils";
import { useEffect } from "react";

import useYescoinCollectCoinMutation from "../hooks/useYescoinCollectCoinMutation";
import useYescoinCollectSpecialBoxCoinMutation from "../hooks/useYescoinCollectSpecialBoxCoinMutation";
import useYescoinGameInfoQuery from "../hooks/useYescoinGameInfoQuery";
import useYescoinGameSpecialBoxInfoQuery from "../hooks/useYescoinGameSpecialBoxInfoQuery";

export default function YescoinGamer() {
  const process = useProcessLock("yescoin.game");
  const gameInfoQuery = useYescoinGameInfoQuery();
  const specialBoxInfoQuery = useYescoinGameSpecialBoxInfoQuery({
    enabled: process.started,
  });

  const specialBox = specialBoxInfoQuery.data;
  const coinLeft = gameInfoQuery.data?.coinPoolLeftCount;

  const collectCoinMutation = useYescoinCollectCoinMutation();
  const collectSpecialBoxMutation = useYescoinCollectSpecialBoxCoinMutation();

  /** Auto Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (coinLeft < 100) {
      return process.stop();
    }

    (async function () {
      /** Lock */
      process.lock();

      const toCollect = Math.min(coinLeft, 80 + Math.floor(Math.random() * 10));

      if (!process.signal.aborted) {
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

        await delay(10_000);
      }

      /** Unlock */
      process.unlock();
    })();
  }, [process, coinLeft, specialBox]);

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
