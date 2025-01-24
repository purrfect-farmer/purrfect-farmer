import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import {
  canJoinTelegramLink,
  cn,
  customLogger,
  delay,
  isTelegramLink,
} from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useZooCheckQuestMutation from "../hooks/useZooCheckQuestMutation";
import useZooClaimQuestMutation from "../hooks/useZooClaimQuestMutation";
import useZooDataQueries from "../hooks/useZooDataQueries";

export default memo(function ZooAutoTasks() {
  const { joinTelegramLink } = useFarmerContext();

  const process = useProcessLock("zoo.tasks");
  const checkTaskMutation = useZooCheckQuestMutation();
  const claimTaskMutation = useZooClaimQuestMutation();
  const dataQueries = useZooDataQueries();

  const [allData, afterData] = dataQueries.data;
  const profile = allData.profile;
  const friendsCount = profile.friends;
  const queryClient = useQueryClient();

  /** Validate Invite Task */
  const validateInviteTask = useCallback(
    (task) => task.checkType === "invite" && task.checkCount <= friendsCount,
    [friendsCount]
  );

  /** Validate Telegram Task */
  const validateTelegramTask = useCallback(
    (task) =>
      isTelegramLink(task.actionUrl) && task.checkType.includes("telegram"),
    []
  );

  /** Validate FakeCheck Task */
  const validateFakeCheckTask = useCallback(
    (task) => ["fakeCheck"].includes(task.checkType),
    []
  );

  /** All Tasks */
  const tasks = useMemo(
    () =>
      allData.dbData.dbQuests.filter(
        (item) =>
          validateFakeCheckTask(item) ||
          validateInviteTask(item) ||
          validateTelegramTask(item)
      ),
    [allData, validateFakeCheckTask, validateInviteTask, validateTelegramTask]
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

  /** Log Tasks */
  useEffect(() => {
    customLogger("ZOO ALL TASKS", tasks);
    customLogger("ZOO PENDING TASKS", pendingTasks);
    customLogger("ZOO FINISHED TASKS", finishedTasks);
  }, [tasks, pendingTasks, finishedTasks]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Tasks */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute Process */
    process.execute(async function () {
      for (let [index, task] of Object.entries(pendingTasks)) {
        if (process.controller.signal.aborted) return;

        /** Reset Mutation */
        claimTaskMutation.reset();

        /** Set Current Task */
        setCurrentTask(task);

        try {
          /** Join Link */
          if (
            isTelegramLink(task.actionUrl) &&
            canJoinTelegramLink(task.actionUrl)
          ) {
            await joinTelegramLink(task.actionUrl);
          }
          if (task.checkType !== "fakeCheck") {
            /** Check */
            await checkTaskMutation.mutateAsync([task.key, null]);
          }

          /** Claim */
          await claimTaskMutation
            .mutateAsync([task.key, null])
            .then((result) => {
              /** Update All Data */
              queryClient.setQueryData(["zoo", "all"], (prev) => {
                return {
                  ...prev,
                  hero: result.hero,
                };
              });

              /** Update After Data */
              queryClient.setQueryData(["zoo", "after"], (prev) => {
                return {
                  ...prev,
                  quests: result.quests,
                };
              });
            });
        } catch {}

        /** Delay */
        await delay(5_000);
      }

      /** Stop */
      reset();

      /** Stop */
      return true;
    });
  }, [process, pendingTasks, setCurrentTask, reset]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", true, process);

  return (
    <>
      <div className="flex flex-col py-2">
        <>
          {/* Tasks Info */}
          <div className="p-4 rounded-lg bg-lime-800">
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
              onClick={() => process.dispatchAndToggle(!process.started)}
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
});
