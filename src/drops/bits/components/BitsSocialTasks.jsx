import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useBitsClaimSocialTaskMutation from "../hooks/useBitsClaimSocialTaskMutation";
import useBitsSocialTasksQuery from "../hooks/useBitsSocialTasksQuery";
import useBitsStartSocialTaskMutation from "../hooks/useBitsStartSocialTaskMutation";

export default function BitsSocialTasks() {
  const client = useQueryClient();
  const query = useBitsSocialTasksQuery();

  /** All Tasks */
  const tasks = useMemo(() => query.data || [], [query]);

  /** Finished Tasks */
  const finishedTasks = useMemo(
    () => tasks.filter((item) => item.status === "IsDone"),
    [tasks]
  );

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () => tasks.filter((item) => item.status === "None"),
    [tasks]
  );
  /** Unclaimed Tasks */
  const unclaimedTasks = useMemo(
    () => tasks.filter((item) => item.status === "Validated"),
    [tasks]
  );

  const process = useProcessLock();

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  const startTaskMutation = useBitsStartSocialTaskMutation();
  const claimTaskMutation = useBitsClaimSocialTaskMutation();

  /** Reset Task */
  const resetTask = useCallback(() => {
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setCurrentTask, setTaskOffset]);

  /** Reset */
  const reset = useCallback(() => {
    resetTask();
    setAction(null);
  }, [resetTask, setAction]);

  /** Refetch Tasks */
  const refetchTasks = useCallback(() => query.refetch(), [query.refetch]);

  /** Refetch Balance */
  const refetchBalance = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["bits", "user"],
      }),
    [client]
  );

  /** Handle button click */
  const [handleAutoClaimClick, dispatchAndHandleAutoClaimClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        reset();
        process.toggle();
      }, [reset, process]),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "bits.tasks.claim",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "bits.tasks.claim": () => {
          handleAutoClaimClick();
        },
      }),
      [handleAutoClaimClick]
    )
  );

  /** Run Tasks */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      const refetch = async () => {
        try {
          await refetchTasks();
          await refetchBalance();
        } catch {}
      };

      if (!action) {
        setAction("start");
        return;
      }
      switch (action) {
        case "start":
          /** Beginning of Start Action */
          setAction("start");
          for (let [index, task] of Object.entries(pendingTasks)) {
            if (process.signal.aborted) return;

            setTaskOffset(index);
            setCurrentTask(task);
            try {
              await startTaskMutation.mutateAsync({
                name: task.socialTask.name,
              });
            } catch {}

            /** Delay */
            await delay(5_000);
          }

          // Set Next Action
          try {
            await refetchTasks();
          } catch {}
          resetTask();
          setAction("claim");

          return;

        case "claim":
          /** Claim */
          for (let [index, task] of Object.entries(unclaimedTasks)) {
            if (process.signal.aborted) return;
            setTaskOffset(index);
            setCurrentTask(task);
            try {
              await claimTaskMutation.mutateAsync({
                name: task.socialTask.name,
              });
            } catch {}

            /** Delay */
            await delay(5_000);
          }
          break;
      }

      await refetch();
      resetTask();
      process.stop();
    })();
  }, [process, action]);

  return (
    <>
      <div className="flex flex-col p-4">
        {query.isPending ? (
          <h4 className="font-bold">Fetching tasks...</h4>
        ) : query.isError ? (
          <h4 className="font-bold text-red-500">Failed to fetch tasks...</h4>
        ) : (
          <>
            {/* Tasks Info */}
            <h4 className="font-bold">Total Tasks: {tasks.length}</h4>
            <h4 className="font-bold text-green-500">
              Finished Tasks: {finishedTasks.length}
            </h4>
            <h4 className="font-bold text-yellow-500">
              Pending Tasks: {pendingTasks.length}
            </h4>

            <h4 className="font-bold text-purple-500">
              Unclaimed Tasks: {unclaimedTasks.length}
            </h4>

            <div className="flex flex-col gap-2 py-2">
              {/* Start Button */}
              <button
                className={cn(
                  "px-4 py-2 rounded-lg text-black",
                  process.started ? "bg-red-500" : "bg-green-500"
                )}
                onClick={dispatchAndHandleAutoClaimClick}
                disabled={
                  (pendingTasks.length === 0 && unclaimedTasks.length === 0) ||
                  process.started
                }
              >
                {process.started ? "Stop" : "Start"}
              </button>

              {process.started && currentTask ? (
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-800">
                  <h4 className="font-bold">
                    Current Mode:{" "}
                    <span
                      className={
                        action === "start"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }
                    >
                      {action === "start" ? "Starting Task" : "Claiming Task"}{" "}
                      {+taskOffset + 1}
                    </span>
                  </h4>
                  <p
                    className={cn(
                      "capitalize",
                      {
                        success: "text-green-500",
                        error: "text-red-500",
                      }[
                        action === "start"
                          ? startTaskMutation.status
                          : claimTaskMutation.status
                      ]
                    )}
                  >
                    {action === "start"
                      ? startTaskMutation.status
                      : claimTaskMutation.status}
                  </p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
}
