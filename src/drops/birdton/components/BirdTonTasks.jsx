import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/drops/notpixel/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { cn, delayForSeconds } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useBirdTonHandlers from "../hooks/useBirdTonHandlers";

export default function BirdTonTasks() {
  const { eventData, sendMessage, refreshTasks } = useFarmerContext();

  const [reloadTasks, dispatchAndReloadTasks] = useSocketDispatchCallback(
    useCallback(() => {
      /** Refresh */
      refreshTasks();

      /** Toast */
      toast.success("Refreshed Tasks");
    }, [refreshTasks]),

    /** Dispatch */
    useCallback((socket) => {
      socket.dispatch({
        action: "birdton.tasks.reload",
      });
    }, [])
  );

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

  const process = useProcessLock("birdton.tasks.claim");
  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  /** Reset Task */
  const reset = useCallback(() => {
    setAction(null);
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setAction, setCurrentTask, setTaskOffset]);

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "birdton.tasks.reload": () => {
          reloadTasks();
        },
      }),
      [reloadTasks]
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

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      /** Lock the Process */
      process.lock();

      /** Beginning Daily Tasks */
      setAction("daily");
      for (let [index, task] of Object.entries(unclaimedDailyTasks)) {
        if (process.controller.signal.aborted) return;
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
          await delayForSeconds(1);
        }
      }

      /** Reset */
      reset();

      /** Sub Tasks */
      setAction("sub");
      for (let [index, task] of Object.entries(unclaimedSubTasks)) {
        if (process.controller.signal.aborted) return;
        setTaskOffset(index);
        setCurrentTask(task);

        if (!task["is_completed"]) {
          sendMessage({
            event_type: "sub_task_completed",
            data: JSON.stringify(task["task_id"]),
          });

          /** Delay */
          await delayForSeconds(1);
        }

        /** Collect Task */
        sendMessage({
          event_type: "collect_sub_task",
          data: JSON.stringify(task["task_id"]),
        });

        /** Delay */
        await delayForSeconds(1);
      }

      /** Refresh the tasks */
      refreshTasks();

      /** Reset */
      reset();

      /** Stop the process */
      process.stop();
    })();
  }, [process]);

  /** Auto-Complete */
  useFarmerAutoProcess("tasks", true, process.start);

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
        <div className="flex gap-2">
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "grow min-h-0 min-w-0",
              "w-full px-4 py-2 uppercase rounded-lg font-bold disabled:opacity-50 text-white",
              !process.started ? "bg-sky-500" : "bg-red-500"
            )}
          >
            {!process.started ? "Start" : "Stop"}
          </button>

          <button
            onClick={dispatchAndReloadTasks}
            className={cn(
              "p-2 text-black rounded-lg disabled:opacity-50",
              "bg-sky-100",
              "font-bold",
              "shrink-0"
            )}
          >
            <HiOutlineArrowPath className="w-4 h-4" />
          </button>
        </div>

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
