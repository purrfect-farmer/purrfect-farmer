import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useProcessLock from "@/hooks/useProcessLock";
import { CgSpinner } from "react-icons/cg";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import useYescoinAccountInfoQuery from "../hooks/useYescoinAccountInfoQuery";
import useYescoinCheckTaskMutation from "../hooks/useYescoinCheckTaskMutation";
import useYescoinClaimTaskMutation from "../hooks/useYescoinClaimTaskMutation";
import useYescoinClickTaskMutation from "../hooks/useYescoinClickTaskMutation";
import useYescoinFinishTaskBonusInfoQuery from "../hooks/useYescoinFinishTaskBonusInfoQuery";
import useYescoinTaskListQuery from "../hooks/useYescoinTaskListQuery";

export default memo(function YescoinTasks() {
  const finishTaskBonusInfoQuery = useYescoinFinishTaskBonusInfoQuery();
  const accountInfoQuery = useYescoinAccountInfoQuery();
  const tasksQuery = useYescoinTaskListQuery();
  const tasks = useMemo(
    () =>
      tasksQuery.data?.taskList
        ?.concat(tasksQuery.data?.specialTaskList)
        ?.filter((task) => ["ton", "star"].includes(task.taskLink) === false) ||
      [],
    [tasksQuery.data]
  );

  const uncompletedTasks = useMemo(
    () => tasks.filter((item) => !item.taskStatus),
    [tasks]
  );

  const clickTaskMutation = useYescoinClickTaskMutation();
  const checkTaskMutation = useYescoinCheckTaskMutation();
  const claimTaskMutation = useYescoinClaimTaskMutation();

  const process = useProcessLock("yescoin.tasks");
  const [taskOffset, setTaskOffset] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);

  const reset = useCallback(() => {
    setTaskOffset(null);
    setCurrentTask(null);
  }, [setTaskOffset, setCurrentTask]);

  const runTask = useCallback(async (id) => {
    await toast.promise(
      (async function () {
        /** Click */
        await clickTaskMutation.mutateAsync(id);
        await delay(5000);

        /** Check */
        const result = await checkTaskMutation.mutateAsync(id);
        await delay(5000);

        if (!result) {
          throw "Not Completed!";
        } else {
          /** Claim */
          await claimTaskMutation.mutateAsync(id);
        }
      })(),
      {
        loading: "Working...",
        error: "Error!",
        success: "Successfully Claimed",
      }
    );
  }, []);

  const [claimTask, dispatchAndClaimTask] = useMirroredCallback(
    "yescoin.claim-task",
    async (id) => {
      if (!tasks.some((task) => task.taskId === id && !task.taskStatus)) return;

      await runTask(id);

      await tasksQuery.refetch();
      await accountInfoQuery.refetch();
    },
    [tasks, runTask]
  );

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute the process */
    process.execute(async function () {
      for (let [index, task] of Object.entries(uncompletedTasks)) {
        if (process.controller.signal.aborted) return;
        setTaskOffset(index);
        setCurrentTask(task);

        try {
          await runTask(task.taskId);
        } catch {}

        /** Delay */
        await delay(3_000);
      }

      try {
        await tasksQuery.refetch();
        await accountInfoQuery.refetch();
        await finishTaskBonusInfoQuery.refetch();
      } catch {}

      /** Stop */
      return true;
    });
  }, [process]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", !tasksQuery.isLoading, process);

  return tasksQuery.isPending ? (
    <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
  ) : tasksQuery.isError ? (
    <div className="text-center">Error....</div>
  ) : (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "px-4 py-2 rounded-lg text-white font-bold disabled:opacity-50",
          !process.started ? "bg-purple-500" : "bg-red-500"
        )}
      >
        {!process.started ? "Auto Claim" : "Stop"}
      </button>

      {process.started && currentTask ? (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-900">
          <h4 className="font-bold">
            <span className="text-yellow-500">
              Running Task {taskOffset !== null ? +taskOffset + 1 : null}
            </span>
          </h4>
          <h5 className="font-bold text-purple-500">
            {currentTask.taskDescription}...
          </h5>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <button
            key={task.taskId}
            onClick={() => dispatchAndClaimTask(task.taskId)}
            disabled={task["taskStatus"]}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-700",
              "disabled:opacity-50",
              "text-left"
            )}
          >
            <img src={task["taskIcon"]} className="w-10 h-10 shrink-0" />
            <div className="flex flex-col min-w-0 min-h-0 grow">
              <h1 className="font-bold">{task["taskDescription"]}</h1>
              <p className="text-orange-500">
                +{Intl.NumberFormat().format(task["taskBonusAmount"])}{" "}
                <img src={CoinIcon} className="inline h-4" />
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
