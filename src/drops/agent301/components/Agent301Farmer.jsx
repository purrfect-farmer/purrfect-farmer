import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";
import Agent301BalanceDisplay from "./Agent301BalanceDisplay";
import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";
import Agent301Lottery from "./Agent301Lottery";
import Agent301Puzzle from "./Agent301Puzzle";
import Agent301Tasks from "./Agent301Tasks";
import Agent301Wheel from "./Agent301Wheel";
import Tabs from "@/components/Tabs";

export default memo(function Agent301Farmer() {
  const tabs = useMirroredTabs("agent301.farmer-tabs", [
    "tickets",
    "wheel",
    "tasks",
  ]);

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img src={Agent301Icon} alt="Agent301 Farmer" className="w-8 h-8" />
        <h1 className="font-bold">Agent301 Farmer</h1>
      </div>

      {/* Balance Display */}
      <Agent301BalanceDisplay />

      {/* Puzzle */}
      <Agent301Puzzle />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-4"}
        triggerClassName={"data-[state=active]:border-white"}
      >
        <Tabs.Content value="tickets">
          <Agent301Lottery />
        </Tabs.Content>
        <Tabs.Content value="wheel">
          <Agent301Wheel />
        </Tabs.Content>
        <Tabs.Content value="tasks">
          <Agent301Tasks />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
