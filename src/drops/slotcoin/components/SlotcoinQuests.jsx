import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useSlotcoinCheckTaskMutation from "../hooks/useSlotcoinCheckTaskMutation";
import useSlotcoinQuestsQuery from "../hooks/useSlotcoinQuestsQuery";

export default function SlotcoinQuests() {
  const { joinTelegramLink } = useFarmerContext();
  const process = useProcessLock("slotcoin.quests");
  const queryClient = useQueryClient();

  const questsQuery = useSlotcoinQuestsQuery();
  const quests = useMemo(
    () => questsQuery.data?.quests || [],
    [questsQuery.data]
  );

  const tasks = useMemo(
    () => quests.reduce((prev, current) => prev.concat(current.tasks), []),
    [quests]
  );

  const completedTasks = useMemo(
    () => tasks.filter((item) => item["is_completed"]),
    [tasks]
  );

  const uncompletedTasks = useMemo(
    () => tasks.filter((item) => !item["is_completed"]),
    [tasks]
  );

  const checkTaskMutation = useSlotcoinCheckTaskMutation();

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);

  const reset = useCallback(() => {
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setCurrentTask, setTaskOffset]);

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
          if (task["task_data"]?.["channel_url"]) {
            await joinTelegramLink(task["task_data"]?.["channel_url"]);
          }
          await checkTaskMutation.mutateAsync(task.id);
        } catch {}

        /** Delay */
        await delay(5_000);
      }

      try {
        await queryClient.refetchQueries({
          queryKey: ["slotcoin"],
        });
      } catch {}

      process.stop();
    })();
  }, [process, joinTelegramLink]);

  /** Auto-Complete Quests */
  useFarmerAutoProcess("quests", !questsQuery.isLoading, process.start);

  return (
    <div className="p-4">
      {questsQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : // Error
      questsQuery.isError ? (
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
                  }[checkTaskMutation.status]
                )}
              >
                {checkTaskMutation.status}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
