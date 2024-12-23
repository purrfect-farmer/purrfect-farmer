import * as Tabs from "@radix-ui/react-tabs";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { CgSpinner } from "react-icons/cg";
import { cn } from "@/lib/utils";
import { memo } from "react";

import YescoinBalanceDisplay from "./YescoinBalanceDisplay";
import YescoinDailyMission from "./YescoinDailyMission";
import YescoinGamer from "./YescoinGamer";
import YescoinIcon from "../assets/images/icon.png?format=webp&w=80";
import YescoinTasks from "./YescoinTasks";
import useYescoinAccountInfoQuery from "../hooks/useYescoinAccountInfoQuery";
import useYescoinDailyCheckIn from "../hooks/useYescoinDailyCheckIn";
import useYescoinOfflineQuery from "../hooks/useYescoinOfflineQuery";
import useYescoinSpecialBoxClaim from "../hooks/useYescoinSpecialBoxClaim";
import useYescoinTaskBonusClaim from "../hooks/useYescoinTaskBonusClaim";

export default memo(function YescoinFarmer() {
  const accountInfoQuery = useYescoinAccountInfoQuery();
  const tabs = useSocketTabs("yescoin.farmer-tabs", [
    "game",
    "missions",
    "tasks",
  ]);

  useYescoinDailyCheckIn();
  useYescoinSpecialBoxClaim();
  useYescoinTaskBonusClaim();
  useYescoinOfflineQuery();

  /** Automatically Switch Tab */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img
          src={YescoinIcon}
          alt="Yescoin Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Yescoin Farmer</h1>
      </div>

      {accountInfoQuery.isSuccess ? (
        <>
          <YescoinBalanceDisplay />
          <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
            <Tabs.List className="grid grid-cols-3">
              {tabs.list.map((value, index) => (
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

            {/* Game */}
            <Tabs.Content
              forceMount
              className="data-[state=inactive]:hidden"
              value="game"
            >
              <YescoinGamer />
            </Tabs.Content>

            {/* Daily Mission */}
            <Tabs.Content
              forceMount
              className="data-[state=inactive]:hidden"
              value="missions"
            >
              <YescoinDailyMission />
            </Tabs.Content>

            {/* Tasks */}
            <Tabs.Content
              forceMount
              className="data-[state=inactive]:hidden"
              value="tasks"
            >
              <YescoinTasks />
            </Tabs.Content>
          </Tabs.Root>
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
});
