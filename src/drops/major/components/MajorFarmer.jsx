import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useSocketTabs from "@/hooks/useSocketTabs";
import { CgSpinner } from "react-icons/cg";
import { cn, delay } from "@/lib/utils";
import { useEffect } from "react";

import MajorBalanceDisplay from "./MajorBalanceDisplay";
import MajorGames from "./MajorGames";
import MajorIcon from "../assets/images/icon.png?format=webp&w=80";
import MajorTasks from "./MajorTasks";
import useMajorUserQuery from "../hooks/useMajorUserQuery";
import useMajorUserStreakQuery from "../hooks/useMajorUserStreakQuery";
import useMajorUserVisitMutation from "../hooks/useMajorUserVisitMutation";

export default function MajorFarmer() {
  const tabs = useSocketTabs("major.farmer-tabs", "games");

  const streakQuery = useMajorUserStreakQuery();
  const userQuery = useMajorUserQuery();

  const visitMutation = useMajorUserVisitMutation();

  useEffect(() => {
    if (!streakQuery.data) return;

    (async function () {
      /** Delay */
      await delay(2000);

      const data = await visitMutation.mutateAsync();

      if (data["is_increased"]) {
        await delay(2000);
        await streakQuery.refetch();
        toast.success("Major Daily Check-in Claimed");
      }
    })();
  }, [streakQuery.data]);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img
          src={MajorIcon}
          alt="Major Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Major Farmer</h1>
      </div>

      {userQuery.isSuccess ? (
        <>
          <MajorBalanceDisplay />
          <Tabs.Root {...tabs} className="flex flex-col gap-4">
            <Tabs.List className="grid grid-cols-2">
              {["games", "tasks"].map((value, index) => (
                <Tabs.Trigger
                  key={index}
                  value={value}
                  className={cn(
                    "p-2",
                    "border-b-2 border-transparent",
                    "data-[state=active]:border-orange-500"
                  )}
                >
                  {value.toUpperCase()}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="games">
              <MajorGames />
            </Tabs.Content>
            <Tabs.Content value="tasks">
              <MajorTasks />
            </Tabs.Content>
          </Tabs.Root>
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
}
