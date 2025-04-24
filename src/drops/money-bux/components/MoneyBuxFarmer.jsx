import Tabs from "@/components/Tabs";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";

import MoneyBuxAutoTasks from "./MoneyBuxAutoTasks";
import MoneyBuxBalanceDisplay from "./MoneyBuxBalanceDisplay";
import MoneyBuxFarmerHeader from "./MoneyBuxFarmerHeader";
import MoneyBuxTickets from "./MoneyBuxTickets";
import MoneyBuxWheel from "./MoneyBuxWheel";

export default memo(function MoneyBuxFarmer() {
  const tabs = useMirroredTabs("money-bux.farmer-tabs", [
    "tasks",
    "wheel",
    "tickets",
  ]);

  return (
    <div className="flex flex-col p-4">
      <MoneyBuxFarmerHeader />
      <MoneyBuxBalanceDisplay />

      <Tabs
        tabs={tabs}
        triggerClassName={"data-[state=active]:border-orange-500"}
      >
        <Tabs.Content value="tasks">
          <MoneyBuxAutoTasks />
        </Tabs.Content>

        <Tabs.Content value="wheel">
          <MoneyBuxWheel />
        </Tabs.Content>

        <Tabs.Content value="tickets">
          <MoneyBuxTickets />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
