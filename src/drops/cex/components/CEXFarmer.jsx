import { Tabs } from "radix-ui";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { cn } from "@/lib/utils";
import { memo } from "react";

import CEXCards from "./CEXCards";
import CEXIcon from "../assets/images/icon.png?format=webp&w=80";
import CEXInfoDisplay from "./CEXInfoDisplay";
import CEXTasks from "./CEXTasks";

export default memo(function CEXFarmer() {
  const tabs = useMirroredTabs("cex.farmer-tabs", ["cards", "tasks"]);

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-3 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img src={CEXIcon} alt="CEX Farmer" className="w-8 h-8 rounded-full" />
        <h1 className="font-bold">CEX Farmer</h1>
      </div>

      {/* Info */}
      <CEXInfoDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col">
        <Tabs.List className="grid grid-cols-2">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-orange-500"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Cards */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="cards"
        >
          <CEXCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <CEXTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
