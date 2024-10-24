import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useHrumClaimQuestMutation from "../hooks/useHrumClaimQuestMutation";

export default function HrumAutoTasks({ queries }) {
  const process = useProcessLock();
  const claimTaskMutation = useHrumClaimQuestMutation();
  const [allData, afterData] = queries.data;

  /** All Tasks */
  const tasks = useMemo(
    () =>
      allData.dbData.dbQuests.filter((item) =>
        ["fakeCheck"].includes(item.checkType)
      ),
    [allData]
  );

  /** Finished Tasks */
  const finishedTasks = useMemo(
    () =>
      tasks.filter((item) =>
        afterData.quests.find((quest) => quest.key === item.key)
      ),
    [tasks, afterData]
  );

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (item) => !afterData.quests.find((quest) => quest.key === item.key)
      ),
    [tasks, afterData]
  );

  /** Current Running Task */
  const [currentTask, setCurrentTask] = useState(null);

  /** Reset */
  const reset = useCallback(() => {
    setCurrentTask(null);
  }, [setCurrentTask]);

  /** Refetch Balance */
  const refetchBalance = useCallback(
    () => queries.query.forEach((query) => query.refetch()),
    [queries]
  );

  /** Handle button click */
  const [handleAutoClaimClick, dispatchAndHandleAutoClaimClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        process.toggle();
        reset();
      }, [reset, process]),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "hrum.tasks.claim",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "hrum.tasks.claim": () => {
          handleAutoClaimClick();
        },
      }),
      [handleAutoClaimClick]
    )
  );

  /** Run Tasks */
  useEffect(() => {
    if (!process.started || process.locked) {
      return;
    }

    (async function () {
      /** Lock Process */
      process.lock();

      for (let [index, task] of Object.entries(pendingTasks)) {
        if (process.signal.aborted) return;

        /** Set Current Task */
        setCurrentTask(task);

        try {
          /** Claim */
          await claimTaskMutation.mutateAsync([task.key, null]);
        } catch {}

        /** Delay */
        await delay(5_000);
      }

      /** Refetch Balance */
      try {
        await refetchBalance();
      } catch {}

      /** Stop */
      process.stop();
      reset();
    })();
  }, [process, pendingTasks, setCurrentTask, reset, refetchBalance]);

  return (
    <>
      <div className="flex flex-col py-2">
        <>
          {/* Tasks Info */}
          <div className="p-4 bg-purple-800 rounded-lg">
            <h4 className="font-bold">Total Tasks: {tasks.length}</h4>
            <h4 className="font-bold text-green-500">
              Finished Tasks: {finishedTasks.length}
            </h4>
            <h4 className="font-bold text-yellow-500">
              Pending Tasks: {pendingTasks.length}
            </h4>
          </div>

          <div className="flex flex-col gap-2 py-2">
            {/* Start Button */}
            <button
              onClick={dispatchAndHandleAutoClaimClick}
              disabled={pendingTasks.length === 0}
              className={cn(
                "w-full px-4 py-2 uppercase rounded-full",
                "disabled:opacity-50",
                !process.started ? "bg-yellow-500" : "bg-red-500"
              )}
            >
              {process.started ? "Stop" : "Start"}
            </button>

            {process.started && currentTask ? (
              <div className="flex flex-col gap-2 p-4 text-black bg-white rounded-lg">
                <h4 className="font-bold text-green-500">Claiming Task</h4>
                <h5 className="font-bold">{currentTask.title}</h5>
                <p
                  className={cn(
                    "capitalize",
                    {
                      success: "text-green-500",
                      error: "text-red-500",
                    }[claimTaskMutation.status]
                  )}
                >
                  {claimTaskMutation.status}
                </p>
              </div>
            ) : null}
          </div>
        </>
      </div>
    </>
  );
}
