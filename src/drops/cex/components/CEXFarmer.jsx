import Tabs from "@/components/Tabs";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
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

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"border-b-4 data-[state=active]:border-orange-500"}
        className="flex flex-col"
      >
        {/* Cards */}
        <Tabs.Content value="cards">
          <CEXCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content value="tasks">
          <CEXTasks />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
