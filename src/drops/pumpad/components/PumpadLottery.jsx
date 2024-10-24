import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";

import usePumpadLotteryMutation from "../hooks/usePumpadLotteryMutation";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function PumpadLottery() {
  const { lotteryRequest } = useFarmerContext();
  const drawCount = lotteryRequest.data?.["draw_count"] || 0;

  const spinMutation = usePumpadLotteryMutation();

  const process = useProcessLock();

  /** Handle button click */
  const [handleAutoSpinClick, dispatchAndHandleAutoSpinClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        process.toggle();
      }, [process]),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "pumpad.spin",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "pumpad.spin": () => {
          handleAutoSpinClick();
        },
      }),
      [handleAutoSpinClick]
    )
  );

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (!drawCount) {
      process.stop();
      return;
    }

    (async function () {
      // Lock Process
      process.lock();

      /** Spin */
      try {
        await spinMutation.mutateAsync();
        await delay(2000);
      } catch {}

      /** Delay */
      await delay(10_000);

      // Release Lock
      process.unlock();
    })();
  }, [process, drawCount]);

  return (
    <div className="p-4">
      {!lotteryRequest.data ? (
        <div className="flex justify-center">Detecting Lottery...</div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-bold text-center">{drawCount}</h3>
          <p className="text-center text-neutral-500">Lottery</p>

          {/* Auto Spin Button */}
          <button
            disabled={!drawCount}
            onClick={dispatchAndHandleAutoSpinClick}
            className={cn(
              "p-2 text-black rounded-lg disabled:opacity-50",
              process.started ? "bg-red-500" : "bg-pumpad-green-500",
              "font-bold"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {process.started ? (
            <div className="text-center">Working....</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
