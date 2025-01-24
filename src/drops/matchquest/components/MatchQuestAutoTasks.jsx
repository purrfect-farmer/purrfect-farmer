import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, delay, logNicely } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import MatchQuestButton from "./MatchQuestButton";
import useMatchQuestClaimTaskMutation from "../hooks/useMatchQuestClaimTaskMutation";
import useMatchQuestCompleteTaskMutation from "../hooks/useMatchQuestCompleteTaskMutation";
import useMatchQuestTasksQuery from "../hooks/useMatchQuestTasksQuery";
import useMatchQuestUserQuery from "../hooks/useMatchQuestUserQuery";

export default memo(function MatchQuestAutoTasks() {
  const { joinTelegramLink } = useFarmerContext();
  const client = useQueryClient();
  const taskQuery = useMatchQuestTasksQuery();
  const userQuery = useMatchQuestUserQuery();

  /** All Tasks */
  const tasks = useMemo(
    () =>
      taskQuery.data
        ? Object.values(taskQuery.data)
            .reduce((result, item) => result.concat(item || []), [])
            .filter((item) => item.name.includes("join_Dypians") === false)
        : [],
    [taskQuery.data]
  );

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () => tasks.filter((item) => !item.complete),
    [tasks]
  );

  /** Finished Tasks */
  const finishedTasks = useMemo(
    () => tasks.filter((item) => item.complete),
    [tasks]
  );

  const process = useProcessLock("matchquest.tasks");

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);

  const completeTaskMutation = useMatchQuestCompleteTaskMutation();
  const claimTaskMutation = useMatchQuestClaimTaskMutation();

  /** Reset Task */
  const resetTask = useCallback(() => {
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setCurrentTask, setTaskOffset]);

  /** Reset */
  const reset = useCallback(() => {
    resetTask();
  }, [resetTask]);

  /** Refetch Tasks */
  const refetchTasks = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["matchquest", "tasks"],
      }),
    [client]
  );

  /** Refetch Balance */
  const refetchBalance = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["matchquest", "user"],
      }),
    [client]
  );

  /** Log It */
  useEffect(() => {
    logNicely("MATCHQUEST TASKS", tasks);
    logNicely("MATCHQUEST PENDING TASKS", pendingTasks);
    logNicely("MATCHQUEST FINISHED TASKS", finishedTasks);
  }, [tasks, pendingTasks, finishedTasks]);

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

      for (let [index, task] of Object.entries(pendingTasks)) {
        if (process.controller.signal.aborted) return;

        setTaskOffset(index);
        setCurrentTask(task);

        if (canJoinTelegramLink(task.link)) {
          await joinTelegramLink(task.link);
        }

        try {
          /** Complete */
          await completeTaskMutation.mutateAsync(task.name);

          /** Delay */
          await delay(3_000);

          /** Claim */
          await claimTaskMutation.mutateAsync(task.name);
        } catch {}

        /** Delay */
        await delay(5_000);
      }

      await refetch();
      resetTask();
      process.stop();
    })();
  }, [process, joinTelegramLink]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", !taskQuery.isLoading, process);

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

            <div className="flex flex-col gap-2 py-2">
              {/* Start Button */}
              <MatchQuestButton
                color={process.started ? "danger" : "primary"}
                onClick={() => process.dispatchAndToggle(!process.started)}
                disabled={pendingTasks.length === 0}
              >
                {process.started ? "Stop" : "Start"}
              </MatchQuestButton>

              {process.started && currentTask ? (
                <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
                  <h4 className="font-bold">
                    <span className={"text-green-500"}>
                      Running Task {+taskOffset + 1}
                    </span>
                  </h4>
                  <h5 className="font-bold">{currentTask.description}</h5>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
});
