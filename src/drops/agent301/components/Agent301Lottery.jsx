import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { memo, useEffect } from "react";

import useAgent301BalanceQuery from "../hooks/useAgent301BalanceQuery";
import useAgent301LotteryMutation from "../hooks/useAgent301LotteryMutation";

export default memo(function Agent301Lottery() {
  const process = useProcessLock("agent301.lottery");

  const balanceQuery = useAgent301BalanceQuery();
  const result = balanceQuery.data?.result;
  const tickets = result?.tickets;

  const spinMutation = useAgent301LotteryMutation();

  /** Use Effect */
  useEffect(() => {
    if (!process.canExecute) return;

    if (tickets < 1) {
      /** Stop the Process */
      process.stop();
      return;
    }

    /** Execute the Process */
    process.execute(async function () {
      /** Spin */
      try {
        await spinMutation.mutateAsync();
      } catch (e) {
        console.error(e);
      }

      /** Refetch Balance */
      try {
        await balanceQuery.refetch();
      } catch (e) {
        console.error(e);
      }

      /** Delay */
      await delay(10_000);
    });
  }, [process, tickets]);

  /** Auto-Spin */
  useFarmerAutoProcess("tickets", process, [balanceQuery.isLoading === false]);

  return (
    <div className="p-4">
      {balanceQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : // Error
      balanceQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch tickets...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <button
            disabled={tickets < 1}
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 rounded-lg disabled:opacity-50",
              process.started ? "bg-red-500 text-black" : "bg-white text-black"
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
});
