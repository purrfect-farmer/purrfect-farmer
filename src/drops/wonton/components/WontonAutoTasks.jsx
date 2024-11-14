import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/drops/notpixel/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import WontonButton from "./WontonButton";
import useWontonClaimTaskGiftMutation from "../hooks/useWontonClaimTaskGiftMutation";
import useWontonClaimTaskMutation from "../hooks/useWontonClaimTaskMutation";
import useWontonClaimTaskProgressMutation from "../hooks/useWontonClaimTaskProgressMutation";
import useWontonStartTaskMutation from "../hooks/useWontonStartTaskMutation";
import useWontonTasksQuery from "../hooks/useWontonTasksQuery";
import useWontonUserQuery from "../hooks/useWontonUserQuery";

export default function WontonAutoTasks() {
  const { joinTelegramLink } = useFarmerContext();
  const client = useQueryClient();
  const taskQuery = useWontonTasksQuery();
  const userQuery = useWontonUserQuery();

  const user = userQuery.data;

  /** Task Progress */
  const taskProgress = taskQuery.data?.taskProgress || 0;

  /** All Tasks */
  const tasks = useMemo(
    () => (taskQuery.data ? taskQuery.data.tasks : []),
    [taskQuery.data]
  );

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () => tasks.filter((item) => item.status === 0),
    [tasks]
  );

  /** Unclaimed Tasks */
  const unclaimedTasks = useMemo(
    () => tasks.filter((item) => item.status === 1),
    [tasks]
  );

  /** Finished Tasks */
  const finishedTasks = useMemo(
    () => tasks.filter((item) => item.status === 2),
    [tasks]
  );

  const process = useProcessLock();

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  const startTaskMutation = useWontonStartTaskMutation();
  const claimTaskMutation = useWontonClaimTaskMutation();
  const claimProgressMutation = useWontonClaimTaskProgressMutation();
  const claimGiftMutation = useWontonClaimTaskGiftMutation();

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
  const refetchTasks = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["wonton", "tasks"],
      }),
    [client]
  );

  /** Refetch Balance */
  const refetchBalance = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["wonton", "user"],
      }),
    [client]
  );

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Tasks */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      /** Lock the process */
      process.lock();

      const refetch = async () => {
        try {
          await refetchTasks();
          await refetchBalance();
        } catch {}
      };

      if (!action) {
        setAction("start");
        return process.unlock();
      }
      switch (action) {
        case "start":
          /** Beginning of Start Action */
          setAction("start");
          for (let [index, task] of Object.entries(pendingTasks)) {
            if (process.controller.signal.aborted) return;

            setTaskOffset(index);
            setCurrentTask(task);

            if (task.telegramChatId) {
              await joinTelegramLink(task.taskUrl);
            }

            try {
              await startTaskMutation.mutateAsync(task.id);
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

          return process.unlock();

        case "claim":
          /** Claim */
          for (let [index, task] of Object.entries(unclaimedTasks)) {
            if (process.controller.signal.aborted) return;
            setTaskOffset(index);
            setCurrentTask(task);
            try {
              await claimTaskMutation.mutateAsync(task.id);
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
  }, [process, action, joinTelegramLink]);

  /** Claim Progress */
  useEffect(() => {
    (async function () {
      if (taskProgress > 0) {
        await claimProgressMutation.mutateAsync();
        toast.success("Wonton - Claimed Progress");
      }
    })();
  }, [taskProgress, taskQuery.refetch]);

  /** Claim Gifts */
  useEffect(() => {
    (async function () {
      if (
        !user ||
        [user?.hasClaimedBitMart, user?.hasClaimedHackerLeague].every(Boolean)
      ) {
        return;
      }

      if (!user.hasClaimedBitMart) {
        await claimGiftMutation.mutate("BITMART_SIGN_UP");
        toast.success("Wonton - Claimed Bitmart Gift");
        await delay(2000);
      }

      if (!user.hasClaimedHackerLeague) {
        await claimGiftMutation.mutate("HACKER_LEAGUE");
        toast.success("Wonton - Claimed Hacker League");
        await delay(2000);
      }
    })();
  }, [user]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", !taskQuery.isLoading, process.start);

  return (
    <>
      <div className="flex flex-col py-2">
        {taskQuery.isPending ? (
          <h4 className="font-bold">Fetching tasks...</h4>
        ) : taskQuery.isError ? (
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
              <WontonButton
                color={process.started ? "danger" : "primary"}
                onClick={() => process.dispatchAndToggle(!process.started)}
                disabled={
                  pendingTasks.length === 0 && unclaimedTasks.length === 0
                }
              >
                {process.started ? "Stop" : "Start"}
              </WontonButton>

              {process.started && currentTask ? (
                <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-800">
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
                  <h5 className="font-bold">{currentTask.name}</h5>
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
