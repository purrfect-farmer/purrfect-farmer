import AutoBoostTab from "./AutoBoostTab";
import AutoCloudCollectTab from "./AutoCloudCollectTab";
import AutoCultivateTab from "./AutoCultivateTab";
import AutoDashboardTab from "./AutoDashboardTab";
import AutoLoadTab from "./AutoLoadTab";
import AutoStatusTab from "./AutoStatusTab";
import AutoSwapTab from "./AutoSwapTab";
import AutoWithdrawTab from "./AutoWithdrawTab";
import Tabs from "./Tabs";

const tabs = {
  rootProps: { defaultValue: "dashboard" },
  list: [
    "dashboard",
    "boost",
    "withdraw",
    "swap",
    "collect",
    "load",
    "cultivate",
    "status",
  ],
};

export default function AutoPanel() {
  return (
    <Tabs
      tabs={tabs}
      rootClassName="grow overflow-auto gap-0"
      listClassName="flex overflow-x-auto"
      triggerClassName="shrink-0"
    >
      <Tabs.Content value="dashboard">
        <AutoDashboardTab />
      </Tabs.Content>
      <Tabs.Content value="boost">
        <AutoBoostTab />
      </Tabs.Content>
      <Tabs.Content value="withdraw">
        <AutoWithdrawTab />
      </Tabs.Content>
      <Tabs.Content value="swap">
        <AutoSwapTab />
      </Tabs.Content>
      <Tabs.Content value="collect">
        <AutoCloudCollectTab />
      </Tabs.Content>
      <Tabs.Content value="load">
        <AutoLoadTab />
      </Tabs.Content>
      <Tabs.Content value="cultivate">
        <AutoCultivateTab />
      </Tabs.Content>
      <Tabs.Content value="status">
        <AutoStatusTab />
      </Tabs.Content>
    </Tabs>
  );
}
