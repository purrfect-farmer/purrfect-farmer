import toast from "react-hot-toast";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { CgSpinner } from "react-icons/cg";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";

import StarIcon from "../assets/images/star-amount.svg";
import useMajorClaimTaskMutation from "../hooks/useMajorClaimTaskMutation";
import useMajorTasksQuery from "../hooks/useMajorTasksQuery";
import useMajorUserQuery from "../hooks/useMajorUserQuery";

export default function MajorTasks() {
  const userQuery = useMajorUserQuery();
  const tasksQuery = useMajorTasksQuery(true);
  const tasks = useMemo(
    () =>
      tasksQuery.data?.filter((task) =>
        ["subscribe_channel", "stories", "without_check"].includes(task.type)
      ) || [],
    [tasksQuery.data]
  );

  const claimTaskMutation = useMajorClaimTaskMutation();

  const [claimTask, dispatchAndClaimTask] = useSocketDispatchCallback(
    /** Main */
    useCallback((id) => {
      toast
        .promise(claimTaskMutation.mutateAsync(id), {
          loading: "Claiming Task...",
          error: "Failed to Claim..",
          success: "Claimed Successfully",
        })
        .then(async () => {
          await tasksQuery.refetch();
          await userQuery.refetch();
        });
    }, []),

    /** Dispatch */
    useCallback((socket, id) => {
      socket.dispatch({
        action: "major.tasks.claim",
        data: {
          id,
        },
      });
    }, [])
  );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "major.tasks.claim": (command) => {
          claimTask(command.data.id);
        },
      }),
      [claimTask]
    )
  );

  return tasksQuery.isPending ? (
    <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
  ) : tasksQuery.isError ? (
    <div className="text-center">Error....</div>
  ) : (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => dispatchAndClaimTask(task.id)}
          disabled={task["is_completed"]}
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg bg-neutral-50",
            "disabled:opacity-50",
            "text-left"
          )}
        >
          <img
            src={"https://major.bot" + task["icon_url"]}
            className="w-10 h-10 shrink-0"
          />
          <div className="flex flex-col min-w-0 min-h-0 grow">
            <h1 className="font-bold">{task["title"]}</h1>
            <p className="text-orange-500">
              +{Intl.NumberFormat().format(task["award"])}{" "}
              <img src={StarIcon} className="inline h-4" />
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
