import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useBirdTonHandlers from "../hooks/useBirdTonHandlers";

export default function BirdTonTasks() {
  const { eventData, sendAuth, sendMessage } = useFarmerContext();

  const taskProgress = useMemo(
    () => eventData.get("user_task_progress") || [],
    [eventData]
  );

  const dailyTasks = useMemo(
    () =>
      (eventData.get("daily_tasks") || []).map((task) => {
        const progress = taskProgress.find(
          (item) => item["task_id"] === task["task_id"]
        );

        return {
          ...(progress || null),
          ...task,
        };
      }),
    [eventData, taskProgress]
  );

  const claimedDailyTasks = useMemo(
    () =>
      dailyTasks.filter((task) => {
        return task["is_collected"];
      }),
    [dailyTasks]
  );

  const unclaimedDailyTasks = useMemo(
    () =>
      dailyTasks.filter((task) => {
        return !task["is_collected"];
      }),
    [dailyTasks]
  );

  const subTasks = useMemo(() => eventData.get("sub_task") || [], [eventData]);

  const claimedSubTasks = useMemo(
    () => subTasks.filter((task) => task["is_claimed"]),
    [subTasks]
  );

  const unclaimedSubTasks = useMemo(
    () =>
      subTasks.filter((task) =>
        [!task["sub_check"], !task["is_claimed"], !task["is_sub_api"]].every(
          Boolean
        )
      ),
    [subTasks]
  );

  const process = useProcessLock();
  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  /** Reset Task */
  const reset = useCallback(() => {
    setAction(null);
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setAction, setCurrentTask, setTaskOffset]);

  /** Handle button click */
  const [handleAutoTaskClick, dispatchAndHandleAutoTaskClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        reset();
        process.toggle();
      }, [reset, process]),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "birdton.tasks.claim",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "birdton.tasks.claim": () => {
          handleAutoTaskClick();
        },
      }),
      [handleAutoTaskClick]
    )
  );

  /** Handlers */
  useBirdTonHandlers(
    useMemo(
      () => ({
        ["collect_sub_task"]: (message) => {
          //
        },
        ["collect_task"]: (message) => {
          //
        },
      }),
      []
    )
  );

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function name() {
      /** Beginning Daily Tasks */
      setAction("daily");
      for (let [index, task] of Object.entries(unclaimedDailyTasks)) {
        setTaskOffset(index);
        setCurrentTask(task);

        const isCompleted = task.progress >= task.goal;
        const isCollected = task["is_collected"];
        const canCollect = isCompleted && !isCollected;

        if (canCollect) {
          sendMessage({
            event_type: "collect_task",
            data: JSON.stringify(task["task_id"]),
          });

          /** Delay */
          await delay(5_000);
        }
      }

      /** Reset */
      reset();

      /** Sub Tasks */
      setAction("sub");
      for (let [index, task] of Object.entries(unclaimedSubTasks)) {
        setTaskOffset(index);
        setCurrentTask(task);

        if (!task["is_completed"]) {
          sendMessage({
            event_type: "sub_task_completed",
            data: JSON.stringify(task["task_id"]),
          });

          /** Delay */
          await delay(5000);
        }

        /** Collect Task */
        sendMessage({
          event_type: "collect_sub_task",
          data: JSON.stringify(task["task_id"]),
        });

        /** Delay */
        await delay(5_000);
      }

      reset();
      sendAuth();
      process.stop();
    })();
  }, [process]);

  /** Reload Tasks */
  useEffect(() => {
    sendAuth();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Tasks Info */}
      <h4 className="font-bold text-purple-500">
        Daily Tasks: {dailyTasks.length}/{claimedDailyTasks.length}
      </h4>
      <h4 className="font-bold text-sky-500">
        Sub Tasks: {subTasks.length}/{claimedSubTasks.length}
      </h4>

      <div className="flex flex-col gap-2 py-2">
        {/* Start or Stop Button */}
        <button
          onClick={dispatchAndHandleAutoTaskClick}
          disabled={process.started}
          className={cn(
            "w-full px-4 py-2 uppercase rounded-lg font-bold disabled:opacity-50 text-white",
            !process.started ? "bg-sky-500" : "bg-red-500"
          )}
        >
          {!process.started ? "Start" : "Stop"}
        </button>

        {process.started && currentTask ? (
          <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-800">
            <h4 className="font-bold">
              Current Mode:{" "}
              <span
                className={
                  action === "daily" ? "text-yellow-500" : "text-green-500"
                }
              >
                {action === "daily" ? "Daily Task" : "Sub Task"}{" "}
                {taskOffset !== null ? +taskOffset + 1 : null}
              </span>
            </h4>

            <h5 className="font-bold text-purple-500">
              {action === "sub" ? currentTask["channel_name"] : "Running..."}
            </h5>
          </div>
        ) : null}
      </div>
    </div>
  );
}
