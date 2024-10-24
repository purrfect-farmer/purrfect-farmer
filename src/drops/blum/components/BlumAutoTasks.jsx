import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import useValueTasks from "@/hooks/useValueTasks";
import { cn, delay } from "@/lib/utils";
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
      rawTasks.reduce((tasks, item) => {
        if (!tasks.some((task) => task.id === item.id)) {
          tasks.push(item);
        }
        return tasks;
      }, []),
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

  /** Handle button click */
  const [handleAutoClaimClick, dispatchAndHandleAutoClaimClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        reset();
        process.toggle();
      }, [reset, process]),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "blum.tasks.claim",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "blum.tasks.claim": () => {
          handleAutoClaimClick();
        },
      }),
      [handleAutoClaimClick]
    )
  );

  /** Run Tasks */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      const refetch = async () => {
        try {
          await refetchTasks();
          await refetchBalance();
        } catch {}
      };

      if (!action) {
        setAction("start");
        return;
      }
      switch (action) {
        case "start":
          /** Beginning of Start Action */
          setAction("start");
          for (let [index, task] of Object.entries(pendingTasks)) {
            if (process.signal.aborted) return;

            setTaskOffset(index);
            setCurrentTask(task);
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

          return;
        case "verify":
          /** Verify */
          for (let [index, task] of Object.entries(unverifiedTasks)) {
            if (process.signal.aborted) return;
            setTaskOffset(index);
            setCurrentTask(task);
            try {
              let keyword =
                (await getResolvedValue(task.id)) ||
                (await dispatchAndPrompt(task.id));

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

          // Set Next Action
          try {
            await refetchTasks();
          } catch {}
          resetTask();
          setAction("claim");
          return;

        case "claim":
          /** Claim */
          for (let [index, task] of Object.entries(unclaimedTasks)) {
            if (process.signal.aborted) return;
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

      await refetch();
      resetTask();
      process.stop();
    })();
  }, [
    process,
    action,
    getResolvedValue,
    removeResolvedValue,
    dispatchAndPrompt,
  ]);

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
                onClick={dispatchAndHandleAutoClaimClick}
                disabled={
                  (pendingTasks.length === 0 && unclaimedTasks.length === 0) ||
                  process.started
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
