import toast from "react-hot-toast";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";

import useTruecoin50SpinsBoost from "../hooks/useTruecoin50SpinsBoostMutation";
import useTruecoinLotteryMutation from "../hooks/useTruecoinLotteryMutation";

export default function TruecoinLottery() {
  const { userRequest } = useFarmerContext();

  const user = userRequest.data?.user;

  const spinMutation = useTruecoinLotteryMutation();
  const boostMutation = useTruecoin50SpinsBoost();

  const process = useProcessLock();

  /** Handle button click */
  const [handle50BoostClick, dispatchAndHandle50BoostClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        toast.promise(boostMutation.mutateAsync(), {
          loading: "Please wait",
          error: "Failed to Claim 50 Spins",
          success: "50 Spins Claimed",
        });
      }, []),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "truecoin.50-boost",
        });
      }, [])
    );

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
          action: "truecoin.spin",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "truecoin.spin": () => {
          handleAutoSpinClick();
        },
        "truecoin.50-boost": () => {
          handle50BoostClick();
        },
      }),
      [handleAutoSpinClick, handle50BoostClick]
    )
  );

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (user.currentSpins < 1) {
      return process.stop();
    }

    (async function () {
      // Lock Process
      process.lock();

      try {
        await spinMutation.mutateAsync(null).then((data) => {
          if (data.user.currentSpins < 1) {
            process.stop();
          }

          userRequest.update((prev) => {
            return {
              ...prev,
              user: {
                ...prev.user,
                ...data.user,
              },
            };
          });
        });
      } catch (e) {
        if (e?.response?.status === 400) {
          process.stop();
        }
      }

      /** Delay */
      await delay(5_000);

      // Release Lock
      process.unlock();
    })();
  }, [process, user, userRequest.update]);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Auto Spin Button */}
      <div className="flex gap-2">
        <button
          disabled={user.currentSpins < 1}
          onClick={dispatchAndHandleAutoSpinClick}
          className={cn(
            "grow min-h-0 min-w-0 p-2 text-white rounded-lg disabled:opacity-50",
            process.started ? "bg-red-500" : "bg-purple-500",
            "font-bold"
          )}
        >
          {process.started ? "Stop" : "Start"}
        </button>

        {/* 50 Boost Click */}
        <button
          onClick={dispatchAndHandle50BoostClick}
          className={cn(
            "p-2 text-black rounded-lg disabled:opacity-50",
            "bg-purple-100",
            "font-bold",
            "shrink-0"
          )}
        >
          <HiOutlineArrowPath className="w-4 h-4" />
        </button>
      </div>

      {process.started ? <div className="text-center">Working....</div> : null}
    </div>
  );
}
