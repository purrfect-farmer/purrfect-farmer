import toast from "react-hot-toast";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { cn, delayForSeconds } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";

import useTruecoin50SpinsBoost from "../hooks/useTruecoin50SpinsBoostMutation";
import useTruecoinLotteryMutation from "../hooks/useTruecoinLotteryMutation";
import useSocketState from "@/hooks/useSocketState";
import Slider from "@/components/Slider";

export default function TruecoinLottery() {
  const { queryClient, authQuery, authQueryKey } = useFarmerContext();

  const user = authQuery.data?.user;

  const spinMutation = useTruecoinLotteryMutation();
  const boostMutation = useTruecoin50SpinsBoost();

  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "truecoin.farming-speed",
    2
  );

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
        action: "truecoin.spin",
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
        "truecoin.spin": (command) => {
          toggleAutoSpin(command.data.status);
        },
        "truecoin.50-boost": () => {
          handle50BoostClick();
        },
      }),
      [toggleAutoSpin, handle50BoostClick]
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

          queryClient.setQueryData(authQueryKey, (prev) => {
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
      await delayForSeconds(farmingSpeed);

      // Release Lock
      process.unlock();
    })();
  }, [process, user, farmingSpeed, authQueryKey, queryClient.setQueryData]);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Auto Spin Button */}
      <div className="flex gap-2">
        <button
          disabled={user.currentSpins < 1}
          onClick={() => dispatchAndToggleAutoSpin(!process.started)}
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

      {process.started ? <div className="text-center">Working....</div> : null}
    </div>
  );
}
