import * as Tabs from "@radix-ui/react-tabs";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { CgSpinner } from "react-icons/cg";
import { cn } from "@/lib/utils";
import { memo } from "react";

import ZooAnimals from "./ZooAnimals";
import ZooAutoTasks from "./ZooAutoTasks";
import ZooBalanceDisplay from "./ZooBalanceDisplay";
import ZooIcon from "../assets/images/icon.png?format=webp&w=80";
import ZooQuiz from "./ZooQuiz";
import useZooBoost from "../hooks/useZooBoost";
import useZooDailyClaim from "../hooks/useZooDailyClaim";
import useZooDataQueries from "../hooks/useZooDataQueries";
import useZooRiddleAndRebusClaim from "../hooks/useZooRiddleAndRebusClaim";
import useZooFeed from "../hooks/useZooFeed";

export default memo(function () {
  const dataQueries = useZooDataQueries();
  const tabs = useSocketTabs("zoo.farmer-tabs", [
    "animals",
    "quizzes",
    "tasks",
  ]);

  /** Run Daily Claim */
  useZooDailyClaim();

  /** Run Riddle and Rebus Claim */
  useZooRiddleAndRebusClaim();

  /** Purchase Feed */
  useZooFeed();

  /** Purchase Boost */
  useZooBoost();

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return dataQueries.isPending ? (
    <div className="flex items-center justify-center grow">
      <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
    </div>
  ) : dataQueries.isError ? (
    <div className="flex items-center justify-center text-red-500 grow">
      Error...
    </div>
  ) : (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img src={ZooIcon} alt="Zoo Farmer" className="w-8 h-8 rounded-full" />
        <h1 className="font-bold">Zoo Farmer</h1>
      </div>
      {/* Balance */}
      <ZooBalanceDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-3">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-yellow-500"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="animals"
        >
          <ZooAnimals />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="quizzes"
        >
          <ZooQuiz />
        </Tabs.Content>

        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <ZooAutoTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
