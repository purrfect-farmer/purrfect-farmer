import useFarmerAutoProcess from "@/drops/notpixel/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import useValueTasks from "@/hooks/useValueTasks";
import { cn, delay, logNicely } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import BlumButton from "./BlumButton";
import BlumKeywordPrompt from "./BlumKeywordPrompt";
import useBlumClaimTaskMutation from "../hooks/useBlumClaimTaskMutation";
import useBlumStartTaskMutation from "../hooks/useBlumStartTaskMutation";
import useBlumTasksQuery from "../hooks/useBlumTasksQuery";
import useBlumValidateTaskMutation from "../hooks/useBlumValidateTaskMutation";

export default function BlumAutoTasks() {
  const client = useQueryClient();
  const query = useBlumTasksQuery();

  const { zoomies, dataQuery, joinTelegramLink } = useFarmerContext();

  /** Concat sub tasks */
  const reduceTasks = useCallback(
    (tasks) =>
      tasks.reduce((items, current) => {
        if (current.subTasks) {
          return items.concat(reduceTasks(current.subTasks));
        }

        return items.concat(current);
      }, []),
    []
  );

  /** Join all subsections */
  const rawTasks = useMemo(
    () =>
      query.data
        ?.reduce((all, section) => {
          return all
            .concat(reduceTasks(section.tasks))
            .concat(
              section.subSections.reduce(
                (all, group) => all.concat(reduceTasks(group.tasks)),
                []
              )
            );
        }, [])
        .reduce((tasks, item) => {
          if (!tasks.some((task) => task.id === item.id)) {
            tasks.push(item);
          }
          return tasks;
        }, []) || [],
    [query.data, reduceTasks]
  );

  /** All Tasks */
  const tasks = useMemo(
    () =>
      rawTasks
        .reduce((tasks, item) => {
          if (!tasks.some((task) => task.id === item.id)) {
            tasks.push(item);
          }
          return tasks;
        }, [])
        .filter(
          (task) =>
            ![
              "INTERNAL",
              "APPLICATION_LAUNCH",
              "ONCHAIN_TRANSACTION",
              "WALLET_CONNECTION",
            ].includes(task.type)
        ),
    [rawTasks]
  );

  /** Finished Tasks */
  const finishedTasks = useMemo(
    () => tasks.filter((item) => item.status === "FINISHED"),
    [tasks]
  );

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (item) =>
          item.status === "NOT_STARTED" &&
          !["ONCHAIN_TRANSACTION", "QUEST"].includes(item.kind)
      ),
    [tasks]
  );
  /** Unclaimed Tasks */
  const unclaimedTasks = useMemo(
    () => tasks.filter((item) => item.status === "READY_FOR_CLAIM"),
    [tasks]
  );

  /** Unverified Tasks */
  const unverifiedTasks = useMemo(
    () => tasks.filter((item) => item.status === "READY_FOR_VERIFY"),
    [tasks]
  );

  /** Unverified Tasks */
  const keywordTasks = useMemo(
    () => tasks.filter((item) => item.validationType === "KEYWORD"),
    [tasks]
  );

  const process = useProcessLock();

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  /** Keyword Tasks */
  const {
    valuePrompt,
    dispatchAndPrompt,
    dispatchAndSubmitPrompt,
    getResolvedValue,
    removeResolvedValue,
  } = useValueTasks("blum.keywords");

  /** Prompted Task */
  const promptedTask = useMemo(
    () =>
      valuePrompt
        ? unverifiedTasks.find((item) => item.id === valuePrompt?.id)
        : null,
    [unverifiedTasks, valuePrompt]
  );

  const startTaskMutation = useBlumStartTaskMutation();
  const claimTaskMutation = useBlumClaimTaskMutation();
  const validateTaskMutation = useBlumValidateTaskMutation();

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
        queryKey: ["blum", "tasks"],
      }),
    [client]
  );

  /** Refetch Balance */
  const refetchBalance = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["blum", "balance"],
      }),
    [client]
  );

  /** Get Keyword */
  const getKeyword = useCallback(
    (task) =>
      dataQuery.data?.blum?.keywords?.[task.id] ||
      dataQuery.data?.blum?.keywords?.[task.title.toUpperCase()],
    [dataQuery.data]
  );

  /** Log the Tasks */
  useEffect(() => {
    logNicely("BLUM TASKS", tasks);
  }, [tasks]);

  /** Log the Keyword Tasks */
  useEffect(() => {
    logNicely(
      "BLUM KEYWORD TASKS",
      Object.fromEntries(
        keywordTasks.map((task) => [task.title.toUpperCase(), getKeyword(task)])
      )
    );
  }, [keywordTasks, dataQuery.data]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Tasks */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      /** Lock the Process */
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
            if (task.socialSubscription?.openInTelegram) {
              await joinTelegramLink(task.socialSubscription.url);
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
          setAction("verify");

          return process.unlock();

        case "verify":
          /** Verify */
          for (let [index, task] of Object.entries(unverifiedTasks)) {
            if (process.controller.signal.aborted) return;
            setTaskOffset(index);
            setCurrentTask(task);

            let keyword = getKeyword(task);

            try {
              if (!keyword) {
                keyword = zoomies.enabled
                  ? keyword
                  : (await getResolvedValue(task.id)) ||
                    (await dispatchAndPrompt(task.id));
              }

              if (keyword) {
                try {
                  await validateTaskMutation.mutateAsync({
                    id: task.id,
                    keyword,
                  });
                } catch {
                  await removeResolvedValue(task.id);
                }
              } else continue;
            } catch {}

            /** Delay */
            await delay(5_000);
          }

          /** Set Next Action */
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
              await claimTaskMutation.mutateAsync({ id: task.id });
            } catch {}

            /** Delay */
            await delay(5_000);
          }
          break;
      }

      /** Refetch */
      await refetch();

      /** Reset Task */
      resetTask();

      /** Stop Process */
      process.stop();
    })();
  }, [
    zoomies.enabled,
    process,
    action,
    dataQuery.data,
    getKeyword,
    getResolvedValue,
    removeResolvedValue,
    dispatchAndPrompt,
    joinTelegramLink,
  ]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", !query.isLoading, process.start);

  return (
    <>
      <div className="flex flex-col py-2">
        {query.isPending ? (
          <h4 className="font-bold">Fetching tasks...</h4>
        ) : query.isError ? (
          <h4 className="font-bold text-red-500">Failed to fetch tasks...</h4>
        ) : (
          <>
            {/* Tasks Info */}
            <h4 className="font-bold">Total Tasks: {tasks.length}</h4>
            <h4 className="font-bold text-blum-green-500">
              Finished Tasks: {finishedTasks.length}
            </h4>
            <h4 className="font-bold text-yellow-500">
              Pending Tasks: {pendingTasks.length}
            </h4>
            <h4 className="font-bold text-blue-500">
              Unverified Tasks: {unverifiedTasks.length}
            </h4>

            <h4 className="font-bold text-purple-500">
              Unclaimed Tasks: {unclaimedTasks.length}
            </h4>

            <div className="flex flex-col gap-2 py-2">
              {/* Start Button */}
              <BlumButton
                color={process.started ? "danger" : "primary"}
                onClick={() => process.dispatchAndToggle(!process.started)}
                disabled={
                  pendingTasks.length === 0 && unclaimedTasks.length === 0
                }
              >
                {process.started ? "Stop" : "Start"}
              </BlumButton>

              {process.started && currentTask ? (
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-800">
                  <h4 className="font-bold">
                    Current Mode:{" "}
                    <span
                      className={
                        action === "start"
                          ? "text-yellow-500"
                          : "text-blum-green-500"
                      }
                    >
                      {action === "start"
                        ? "Starting Task"
                        : action === "verify"
                        ? "Verifying Task"
                        : "Claiming Task"}{" "}
                      {+taskOffset + 1}
                    </span>
                  </h4>
                  <h5 className="font-bold">{currentTask.title}</h5>
                  <p
                    className={cn(
                      "capitalize",
                      {
                        success: "text-blum-green-500",
                        error: "text-red-500",
                      }[
                        action === "start"
                          ? startTaskMutation.status
                          : action === "verify"
                          ? validateTaskMutation.status
                          : claimTaskMutation.status
                      ]
                    )}
                  >
                    {action === "start"
                      ? startTaskMutation.status
                      : action === "verify"
                      ? validateTaskMutation.status
                      : claimTaskMutation.status}
                  </p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Prompt Task */}
      {promptedTask ? (
        <BlumKeywordPrompt
          task={promptedTask}
          onSubmit={dispatchAndSubmitPrompt}
        />
      ) : null}
    </>
  );
}
