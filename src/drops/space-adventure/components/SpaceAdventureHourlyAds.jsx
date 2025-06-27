import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useMemo } from "react";

import useSpaceAdventureGetAdsMutation from "../hooks/useSpaceAdventureGetAdsMutation";
import useSpaceAdventureRewardVideoMutation from "../hooks/useSpaceAdventureRewardVideoMutation";
import useSpaceAdventureUserQuery from "../hooks/useSpaceAdventureUserQuery";
import useSpaceAdventureTasksQuery, {
  TASK_CATEGORIES,
} from "../hooks/useSpaceAdventureTasksQuery";

export default function SpaceAdventureHourlyAds() {
  const process = useProcessLock("space-adventure.hourly-ads");
  const userQuery = useSpaceAdventureUserQuery();
  const tasksQuery = useSpaceAdventureTasksQuery(TASK_CATEGORIES.sponsors);
  const videoTasksCount = Number(userQuery.data?.user?.["video_tasks"] || 0);

  const task = useMemo(
    () =>
      tasksQuery.data?.listActive?.find(
        (item) =>
          item.status === "not_completed" && item.title.includes("Watch 3 ads")
      ),
    [tasksQuery.data]
  );

  const canClaim = Boolean(task);
  const getAdsMutation = useSpaceAdventureGetAdsMutation();
  const rewardVideoMutation = useSpaceAdventureRewardVideoMutation();

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (canClaim === false) {
      /** Stop the process */
      process.stop();
      return;
    }

    /** Execute the Process */
    process.execute(async function () {
      /** Claim Task */
      for (let i = videoTasksCount; i < 3; i++) {
        await getAdsMutation.mutateAsync("tasks_reward");
        await rewardVideoMutation.mutateAsync();
        toast.success(`Claimed Video Task - ${i + 1}`);
      }

      await tasksQuery.refetch();
      await userQuery.refetch();

      /** Stop */
      return true;
    });
  }, [process, canClaim, videoTasksCount]);

  /** Auto-Complete Task */
  useFarmerAutoProcess("hourly-ads", process, [tasksQuery.isLoading === false]);

  return (
    <div className="p-4">
      {tasksQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : /** Error */
      tasksQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch tasks...
        </div>
      ) : (
        /** Success */
        <div className="flex flex-col gap-2">
          {/* Start / Stop Button */}
          <button
            disabled={canClaim === false}
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 rounded-lg disabled:opacity-50",
              "font-bold",
              process.started
                ? "bg-red-500 text-white"
                : "bg-purple-500 text-white"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>
        </div>
      )}
    </div>
  );
}
