import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useMoneyBuxEarningsQuery from "../hooks/useMoneyBuxEarningsQuery";
import useMoneyBuxGenerateHashForAdMutation from "../hooks/useMoneyBuxGenerateHashForAdMutation";
import useMoneyBuxTaskMutation from "../hooks/useMoneyBuxTaskMutation";

export default memo(function MoneyBuxAutoTasks() {
  const { joinTelegramLink, updateAuthQueryData } = useFarmerContext();
  const earningsQuery = useMoneyBuxEarningsQuery();

  const process = useProcessLock("money-bux.tasks");

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);

  const generateHashForAdMutation = useMoneyBuxGenerateHashForAdMutation();
  const taskMutation = useMoneyBuxTaskMutation();

  /** Game Tasks */
  const gameTasks = useMemo(
    () => earningsQuery.data?.gameTasks || [],
    [earningsQuery.data]
  );

  /** Social Tasks */
  const socialTasks = useMemo(
    () => earningsQuery.data?.socialTasks || [],
    [earningsQuery.data]
  );

  /** Reset Task */
  const resetTask = useCallback(() => {
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setCurrentTask, setTaskOffset]);

  /** Reset */
  const reset = useCallback(() => {
    resetTask();
  }, [resetTask]);

  /** Log Tasks */
  useEffect(() => {
    customLogger("MONEY-BUX GAME TASKS", gameTasks);
    customLogger("MONEY-BUX SOCIAL TASKS", socialTasks);
  }, [gameTasks, socialTasks]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Tasks */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute the process */
    process.execute(async function () {
      /** Game Tasks */
      for (let [index, task] of Object.entries(gameTasks)) {
        if (process.controller.signal.aborted) return;

        setTaskOffset(index);
        setCurrentTask(task);
        try {
          const { hash } = await generateHashForAdMutation.mutateAsync();
          const result = await taskMutation.mutateAsync({
            category: "games",
            id: task.id,
            hash,
          });

          updateAuthQueryData((prev) => ({
            ...prev,
            ["main_b"]: result["main_b"] || prev["main_b"],
          }));
        } catch (e) {
          console.error(e);
        }

        /** Delay */
        await delay(5000);
      }

      /** Social Tasks */
      for (let [index, task] of Object.entries(socialTasks)) {
        if (process.controller.signal.aborted) return;

        setTaskOffset(index);
        setCurrentTask(task);
        try {
          await joinTelegramLink(task.link);

          const { hash } = await generateHashForAdMutation.mutateAsync();
          const result = await taskMutation.mutateAsync({
            category: "social",
            id: task.id,
            hash,
          });

          updateAuthQueryData((prev) => ({
            ...prev,
            ["main_b"]: result["main_b"] || prev["main_b"],
          }));
        } catch (e) {
          console.error(e);
        }

        /** Delay */
        await delay(5000);
      }

      /** Stop */
      return true;
    });
  }, [process, joinTelegramLink]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", process, [earningsQuery.isLoading === false]);

  return (
    <div className="flex flex-col py-2">
      {earningsQuery.isPending ? (
        <h4 className="font-bold">Fetching tasks...</h4>
      ) : earningsQuery.isError ? (
        <h4 className="font-bold text-red-500">Failed to fetch tasks...</h4>
      ) : (
        <>
          {/* Tasks Info */}
          <h4 className="font-bold text-green-500">
            Game Tasks: {gameTasks.length}
          </h4>
          <h4 className="font-bold text-yellow-500">
            Social Tasks: {socialTasks.length}
          </h4>

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

            {process.started && currentTask ? (
              <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
                <h4 className="font-bold">
                  Current Mode:{" "}
                  <span className={"text-yellow-500"}>
                    Running Task {+taskOffset + 1}
                  </span>
                </h4>

                {/* Status */}
                <p
                  className={cn(
                    "capitalize",
                    {
                      success: "text-green-500",
                      error: "text-red-500",
                    }[taskMutation.status]
                  )}
                >
                  {taskMutation.status}
                </p>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
});
