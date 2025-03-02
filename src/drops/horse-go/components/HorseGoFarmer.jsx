import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useMemo } from "react";

import HorseGoAutoGame from "./HorseGoAutoGame";
import HorseGoBalanceDisplay from "./HorseGoBalanceDisplay";
import HorseGoFarmerHeader from "./HorseGoFarmerHeader";
import HorseGoUsernameDisplay from "./HorseGoUsernameDisplay";
import useHorseGoCompleteTaskMutation from "../hooks/useHorseGoCompleteTaskMutation";
import useHorseGoDailySignInMutation from "../hooks/useHorseGoDailySignInMutation";
import useHorseGoTasksQuery from "../hooks/useHorseGoTasksQuery";
import useHorseGoUserQuery from "../hooks/useHorseGoUserQuery";

export default memo(function HorseGoFarmer() {
  const tabs = useMirroredTabs("horse-go.farmer-tabs", ["game"]);
  const tasksQuery = useHorseGoTasksQuery();
  const userQuery = useHorseGoUserQuery();
  const user = userQuery.data;
  const completeTaskMutation = useHorseGoCompleteTaskMutation();
  const dailySignInMutation = useHorseGoDailySignInMutation();

  const completeTaskList = useMemo(
    () => user?.completeTaskList?.split(",").map(Number) || [],
    [user]
  );
  const completeTaskListDay = useMemo(
    () => user?.completeTaskListDay?.split(",").map(Number) || [],
    [user]
  );
  const completeTaskListWeek = useMemo(
    () => user?.completeTaskListWeek?.split(",").map(Number) || [],
    [user]
  );
  const completeTaskListMonth = useMemo(
    () => user?.completeTaskListMonth?.split(",").map(Number) || [],
    [user]
  );
  const completeTaskListQuarter = useMemo(
    () => user?.completeTaskListQuarter?.split(",").map(Number) || [],
    [user]
  );

  const tasks = useMemo(() => tasksQuery.data || [], [tasksQuery.data]);
  const availableTasks = useMemo(
    () =>
      tasks
        .filter((item) =>
          [
            completeTaskList,
            completeTaskListDay,
            completeTaskListWeek,
            completeTaskListMonth,
            completeTaskListQuarter,
          ].every((list) => list.includes(item.id) === false)
        )
        .map((item) => ({ ...item, currentValue: user?.[item.valueField] })),
    [
      user,
      tasks,
      completeTaskList,
      completeTaskListDay,
      completeTaskListWeek,
      completeTaskListMonth,
      completeTaskListQuarter,
    ]
  );

  const claimableTasks = useMemo(
    () =>
      availableTasks.filter(
        (item) =>
          item.compareType === "GE" && item.currentValue >= item.conditionCount
      ),
    [availableTasks]
  );

  /** Daily Sign In */
  useFarmerAsyncTask(
    "daily-sign-in",
    () => {
      if (userQuery.data) {
        return async function () {
          const { signInStatus } = userQuery.data;

          if (signInStatus === "NO") {
            /** Sign In */
            await dailySignInMutation.mutateAsync();

            /** Toast */
            toast.success("HorseGo Daily Sign-In");

            /** Refetch */
            await userQuery.refetch();
          }
        };
      }
    },
    [userQuery.data]
  );

  /** Complete Tasks */
  useFarmerAsyncTask(
    "complete-tasks",
    () => {
      if (userQuery.isSuccess && tasksQuery.isSuccess) {
        return async function () {
          if (claimableTasks.length < 1) return;

          for (const task of claimableTasks) {
            /** Complete Task */
            await completeTaskMutation.mutateAsync(task.id);

            /** Toast */
            toast.dismiss();
            toast.success(`HorseGo - ${task.nameEn || "Task"}`);

            /** Delay */
            await delay(1000);
          }

          /** Refetch */
          await userQuery.refetch();
        };
      }
    },
    [claimableTasks, userQuery.isSuccess, tasksQuery.isSuccess]
  );

  /** Automatically Switch Tab */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col p-4">
      <HorseGoFarmerHeader />
      <HorseGoUsernameDisplay />
      <HorseGoBalanceDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-1">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-2 border-transparent",
                "data-[state=active]:border-white"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="game"
        >
          <HorseGoAutoGame />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
