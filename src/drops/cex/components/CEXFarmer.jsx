import FarmerHeader from "@/components/FarmerHeader";
import Tabs from "@/components/Tabs";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";

import CEXCards from "./CEXCards";
import CEXIcon from "../assets/images/icon.png?format=webp&w=80";
import CEXInfoDisplay from "./CEXInfoDisplay";
import CEXTasks from "./CEXTasks";
import useCEXUserQuery from "../hooks/useCEXUserQuery";

export default memo(function CEXFarmer() {
  const tabs = useMirroredTabs("cex.farmer-tabs", ["cards", "tasks"]);
  const userQuery = useCEXUserQuery();

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-3 py-4">
      {/* Header */}
      <FarmerHeader
        title={"CEX Farmer"}
        icon={CEXIcon}
        referralLink={
          userQuery.data
            ? `https://t.me/cexio_tap_bot?start=${userQuery.data.refId}`
            : null
        }
      />

      {/* Info */}
      <CEXInfoDisplay />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"data-[state=active]:border-orange-500"}
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
