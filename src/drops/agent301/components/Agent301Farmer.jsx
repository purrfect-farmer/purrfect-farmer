import * as Tabs from "@radix-ui/react-tabs";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn } from "@/lib/utils";

import Agent301BalanceDisplay from "./Agent301BalanceDisplay";
import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";
import Agent301Lottery from "./Agent301Lottery";
import Agent301Puzzle from "./Agent301Puzzle";
import Agent301Tasks from "./Agent301Tasks";
import Agent301Wheel from "./Agent301Wheel";

export default function Agent301Farmer() {
  const tabs = useSocketTabs("agent301.farmer-tabs", [
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

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-3">
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
          value="tickets"
        >
          <Agent301Lottery />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="wheel"
        >
          <Agent301Wheel />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <Agent301Tasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
