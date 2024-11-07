import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { useEffect } from "react";

import useAgent301BalanceQuery from "../hooks/useAgent301BalanceQuery";
import useAgent301LotteryMutation from "../hooks/useAgent301LotteryMutation";
import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function Agent301Lottery() {
  const { processNextTask } = useFarmerContext();
  const process = useProcessLock("agent301.wheel.lottery");

  const balanceQuery = useAgent301BalanceQuery();
  const result = balanceQuery.data?.result;
  const tickets = result?.tickets;

  const spinMutation = useAgent301LotteryMutation();

  /** Use Effect */
  useEffect(() => {
    if (!process.canExecute) return;

    if (tickets < 1) {
      processNextTask();
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
        await balanceQuery.refetch();
      } catch {}

      /** Delay */
      await delay(10_000);

      // Release Lock
      process.unlock();
    })();
  }, [process, tickets, processNextTask]);

  /** Auto-Spin */
  useFarmerAutoTask(
    "tickets",
    () => {
      if (balanceQuery.isSuccess) {
        process.start();
      }
    },
    [balanceQuery.isSuccess, process.start]
  );

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
}
