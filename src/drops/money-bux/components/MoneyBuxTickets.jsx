import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";

import useMoneyBuxGenerateHashForAdMutation from "../hooks/useMoneyBuxGenerateHashForAdMutation";
import useMoneyBuxTicketsQuery from "../hooks/useMoneyBuxTicketsQuery";
import useMoneyBuxUpdateAdCountMutation from "../hooks/useMoneyBuxUpdateAdCountMutation";

export default memo(function MoneyBuxTickets() {
  const { updateQueryData } = useFarmerContext();
  const ticketsQuery = useMoneyBuxTicketsQuery();

  const process = useProcessLock("money-bux.tickets");

  const generateHashForAdMutation = useMoneyBuxGenerateHashForAdMutation();
  const updateAdCountMutation = useMoneyBuxUpdateAdCountMutation();

  /** Run Tickets */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (!ticketsQuery.data) {
      return;
    }

    /** Execute the process */
    process.execute(async function () {
      /** Game Tickets */
      for (let [name, count] of Object.entries(ticketsQuery.data)) {
        if (process.controller.signal.aborted) return;

        for (let i = count; i < 30; i++) {
          if (process.controller.signal.aborted) return;
          try {
            const { hash } = await generateHashForAdMutation.mutateAsync();
            const result = await toast.promise(
              updateAdCountMutation.mutateAsync({
                name,
                hash,
              }),
              {
                loading: "Watching Ticket Ad...",
                success: "Completed Ticket Ad!",
                error: "Error!",
              }
            );

            updateQueryData(["money-bux", "tickets"], (prev) => ({
              ...prev,
              [name]: Number(result[name]),
            }));

            customLogger("MONEY-BOX TICKET", name, result);
          } catch (e) {
            console.error(e);
          }

          /** Delay */
          await delay(1000);
        }
      }

      /** Stop */
      return true;
    });
  }, [process]);

  /** Auto-Complete Tickets */
  useFarmerAutoProcess("tickets", process, [ticketsQuery.isLoading === false]);

  return (
    <div className="flex flex-col py-2">
      {ticketsQuery.isPending ? (
        <h4 className="font-bold">Fetching Tickets...</h4>
      ) : ticketsQuery.isError ? (
        <h4 className="font-bold text-red-500">Failed to fetch tickets...</h4>
      ) : (
        <>
          <div className="flex flex-col gap-2 py-2">
            {/* Start Button */}
            <button
              onClick={() => process.dispatchAndToggle(!process.started)}
              className={cn(
                "p-2 rounded-lg disabled:opacity-50",
                process.started
                  ? "bg-red-500 text-white"
                  : "bg-pink-500 text-white"
              )}
            >
              {process.started ? "Stop" : "Start"}
            </button>
          </div>
        </>
      )}
    </div>
  );
});
