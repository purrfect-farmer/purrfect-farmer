import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useRektCurrentPriceQuery from "../hooks/useRektCurrentPriceQuery";
import useRektUserQuery from "../hooks/useRektUserQuery";
import RektButton from "./RektButton";
import useProcessLock from "@/hooks/useProcessLock";
import { useEffect } from "react";
import { useState } from "react";
import useRektBidMutation from "../hooks/useRektBidMutation";
import useRektGetBidMutation from "../hooks/useRektGetBidMutation";
import { cn, delay } from "@/lib/utils";
import toast from "react-hot-toast";
import { useCallback } from "react";
import Countdown from "react-countdown";

const GAME_DURATION = 5_000;

export default function RektAutoGame() {
  const process = useProcessLock("rekt.game");
  const userQuery = useRektUserQuery();
  const currentPriceQuery = useRektCurrentPriceQuery();

  const trades = userQuery.data?.balance?.trades || 0;
  const price = currentPriceQuery.data?.price || 0;
  const timestamp = currentPriceQuery.data?.timestamp;

  const [prevPrice, setPrevPrice] = useState(price);
  const [priceDirection, setPriceDirection] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const bidMutation = useRektBidMutation();
  const bidResultMutation = useRektGetBidMutation();

  /** Countdown renderer */
  const countdownRenderer = useCallback(
    ({ seconds }) => <span className="text-xl font-bold">{seconds}</span>,
    []
  );

  /** Update Price */
  useEffect(() => {
    if (price !== prevPrice) {
      setPriceDirection(price > prevPrice ? "HIGHER" : "LOWER");
      setPrevPrice(price);
    }
  }, [price, prevPrice]);

  /** Play Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (trades < 1) {
      process.stop();
      return;
    }

    (async function () {
      /** Lock Process */
      process.lock();

      try {
        /** Bid */
        const { id } = await bidMutation.mutateAsync({
          bidType: Math.floor(Math.random() * 2) ? "HIGHER" : "LOWER",
          timestamp,
        });

        /** Countdown */
        setCountdown(Date.now() + GAME_DURATION);

        /** Delay */
        await delay(GAME_DURATION, true);

        /** Reset countdown */
        setCountdown(null);

        /** Get Result */
        const { result } = await bidResultMutation.mutateAsync(id);

        /** Toast */
        if (result === "HIT") {
          toast.success("Rekt - Hit");
        } else {
          toast.success("Rekt - Miss");
        }

        /** Delay */
        await delay(1000);

        /** Refetch */
        await userQuery.refetch();
        await currentPriceQuery.refetch();
      } catch {}

      /** Release Lock */
      process.unlock();
    })();
  }, [process, trades, timestamp]);

  /** Auto-Play Game */
  useFarmerAutoProcess(
    "game",
    [userQuery.isLoading, currentPriceQuery.isLoading].every(
      (status) => !status
    ),
    process
  );

  return (
    <div className="flex flex-col gap-2 py-2">
      <RektButton
        color={process.started ? "danger" : "primary"}
        onClick={() => process.dispatchAndToggle(!process.started)}
        disabled={trades < 1}
      >
        {process.started ? "Stop" : "Start"}
      </RektButton>

      <div className="flex flex-col w-full gap-1 p-4 font-bold bg-black rounded-lg">
        <p
          className={cn(
            {
              HIGHER: "text-green-500",
              LOWER: "text-red-500",
            }[priceDirection]
          )}
        >
          BTC Price: ${price}
        </p>

        {process.started ? (
          <>
            {/* Bid Start */}
            {bidMutation.isPending ? (
              <p className="font-bold text-yellow-500">Starting Bid...</p>
            ) : bidMutation.isError ? (
              <p className="font-bold text-red-500">Failed to start bid...</p>
            ) : bidMutation.isSuccess ? (
              <>
                <p className="font-bold text-purple-500">
                  Bid ID: {bidMutation.data?.id}
                </p>
                <p className="text-sky-500">
                  Bid Direction:{" "}
                  <span
                    className={cn(
                      {
                        HIGHER: "text-green-500",
                        LOWER: "text-red-500",
                      }[bidMutation.data.bidType]
                    )}
                  >
                    {bidMutation.data.bidType}
                  </span>
                </p>
                <p>
                  {countdown ? (
                    <Countdown
                      key={countdown}
                      date={countdown}
                      renderer={countdownRenderer}
                    />
                  ) : bidResultMutation.isPending ? (
                    <span className="text-yellow-500">Getting Result...</span>
                  ) : bidResultMutation.isError ? (
                    <span className="text-red-500">
                      Failed to get result...
                    </span>
                  ) : bidResultMutation.isSuccess ? (
                    <span
                      className={cn(
                        {
                          HIT: "text-green-500",
                          MISS: "text-red-500",
                        }[bidResultMutation.data.result]
                      )}
                    >
                      Result: {bidResultMutation.data.result} - ($
                      {bidResultMutation.data.bidPrice}) to ($
                      {bidResultMutation.data.resultPrice})
                    </span>
                  ) : null}
                </p>
              </>
            ) : (
              <p className="text-gray-400">Loading...</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}