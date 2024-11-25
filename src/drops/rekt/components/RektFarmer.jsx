import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import * as Tabs from "@radix-ui/react-tabs";
import useRektDailyCheckInMutation from "../hooks/useRektDailyCheckInMutation";
import { cn } from "@/lib/utils";
import RektFarmerHeader from "./RektFarmerHeader";
import RektUsernameDisplay from "./RektUsernameDisplay";
import RektBalanceDisplay from "./RektBalanceDisplay";

export default function RektFarmer() {
  const tabs = useSocketTabs("rekt.farmer-tabs", ["game", "quests"]);
  const dailyCheckInMutation = useRektDailyCheckInMutation();

  /** Daily Check-In */
  useFarmerAsyncTask(
    "daily-check-in",
    () => {
      return async function () {
        try {
          const { result } = await dailyCheckInMutation.mutateAsync();
          if (result === "REWARDED") {
            toast.success("Rekt - Daily Check-In");
          }
        } catch {}
      };
    },
    []
  );

  /** Automatically Switch Tab */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col p-4">
      <RektFarmerHeader />
      <RektUsernameDisplay />
      <RektBalanceDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
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
        ></Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="quests"
        ></Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
