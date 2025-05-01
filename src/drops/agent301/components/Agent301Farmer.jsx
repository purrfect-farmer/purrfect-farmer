import FarmerHeader from "@/components/FarmerHeader";
import Tabs from "@/components/Tabs";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";
import Agent301BalanceDisplay from "./Agent301BalanceDisplay";
import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";
import Agent301Lottery from "./Agent301Lottery";
import Agent301Puzzle from "./Agent301Puzzle";
import Agent301Tasks from "./Agent301Tasks";
import Agent301Wheel from "./Agent301Wheel";

export default memo(function Agent301Farmer() {
  const { telegramUser } = useFarmerContext();
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
      <FarmerHeader
        title={"Agent301 Farmer"}
        icon={Agent301Icon}
        referralLink={`https://t.me/Agent301Bot/app?startapp=onetime${telegramUser["id"]}`}
      />

      {/* Balance Display */}
      <Agent301BalanceDisplay />

      {/* Puzzle */}
      <Agent301Puzzle />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
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
