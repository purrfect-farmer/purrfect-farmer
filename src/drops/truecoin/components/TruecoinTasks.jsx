import useFarmerAutoProcess from "@/drops/notpixel/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useTruecoinPartnerTasksQuery from "../hooks/useTruecoinPartnerTasksQuery";
import useTruecoinUserArchivesQuery from "../hooks/useTruecoinUserArchivesQuery";
import useFarmerContext from "@/hooks/useFarmerContext";
import useTruecoinEarnPartnerTaskMutation from "../hooks/useTruecoinEarnPartnerTaskMutation";

export default function TruecoinTasks() {
  const process = useProcessLock("truecoin.tasks");
  const { authQuery, authQueryKey, queryClient } = useFarmerContext();

  const partnerAchives = authQuery.data.partnerAchives;

  const userArchivesQuery = useTruecoinUserArchivesQuery();
  const partnerTasksQuery = useTruecoinPartnerTasksQuery();
  const partnerTasks = useMemo(
    () => partnerTasksQuery.data || [],
    [partnerTasksQuery.data]
  );

  const tasks = useMemo(
    () =>
      partnerTasks.reduce(
        (prev, current) =>
          prev.concat(current.tasks.filter((item) => item.active)),
        []
      ),
    [partnerTasks]
  );

  const completedTasks = useMemo(
    () =>
      tasks.filter((item) =>
        partnerAchives.some((task) => task.taskId === item.id)
      ),
    [tasks, partnerAchives]
  );

  const uncompletedTasks = useMemo(
    () =>
      tasks.filter(
        (item) => !partnerAchives.some((task) => task.taskId === item.id)
      ),
    [tasks, partnerAchives]
  );

  const earnTaskMutation = useTruecoinEarnPartnerTaskMutation();

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);

  const reset = useCallback(() => {
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setCurrentTask, setTaskOffset]);

  /** Update When Archives Refresh */
  useEffect(() => {
    if (!userArchivesQuery.data) return;

    queryClient.setQueryData(authQueryKey, (prev) => {
      return {
        ...prev,
        ...userArchivesQuery.data,
        user: {
          ...prev.user,
          ...userArchivesQuery.data.user,
        },
      };
    });
  }, [userArchivesQuery.data, queryClient.setQueryData, authQueryKey]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      /** Lock the process */
      process.lock();

      for (let [index, task] of Object.entries(uncompletedTasks)) {
        if (process.controller.signal.aborted) return;
        setTaskOffset(index);
        setCurrentTask(task);
        try {
          await earnTaskMutation.mutateAsync(task.id);
        } catch {}

        /** Delay */
        await delay(5_000);
      }

      try {
        await partnerTasksQuery.refetch();
        await userArchivesQuery.refetch();
      } catch {}

      /** Little Delay */
      await delay(1000);

      /** Stop The Process */
      process.stop();
    })();
  }, [process]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", !partnerTasksQuery.isLoading, process.start);

  return (
    <div className="p-4">
      {partnerTasksQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : // Error
      partnerTasksQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch tasks...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <div className="flex flex-col p-2 text-purple-900 bg-purple-100 rounded-lg">
            <p>
              <span className="font-bold text-orange-700">Tasks</span>:{" "}
              <span className="font-bold">{completedTasks.length}</span> /{" "}
              <span className="font-bold">{tasks.length}</span>
            </p>
          </div>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 text-white rounded-lg disabled:opacity-50",
              process.started ? "bg-red-500" : "bg-purple-500"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {process.started && currentTask ? (
            <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-800">
              <h4 className="font-bold">
                <span className="text-yellow-500">
                  Running Task {taskOffset !== null ? +taskOffset + 1 : null}
                </span>
              </h4>
              <h5 className="font-bold">{currentTask.title}</h5>
              <p
                className={cn(
                  "capitalize",
                  {
                    success: "text-green-500",
                    error: "text-red-500",
                  }[earnTaskMutation.status]
                )}
              >
                {earnTaskMutation.status}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}