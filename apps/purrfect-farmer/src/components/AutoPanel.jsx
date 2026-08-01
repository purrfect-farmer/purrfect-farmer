import AutoBoostTab from "./AutoBoostTab";
import AutoCloudCollectTab from "./AutoCloudCollectTab";
import AutoDashboardTab from "./AutoDashboardTab";
import AutoStatusTab from "./AutoStatusTab";
import AutoSwapTab from "./AutoSwapTab";
import AutoWithdrawTab from "./AutoWithdrawTab";
import Tabs from "./Tabs";

const tabs = {
  rootProps: { defaultValue: "dashboard" },
  list: ["dashboard", "boost", "withdraw", "swap", "collect", "status"],
};

export default function AutoPanel() {
  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto gap-0">
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
      <Tabs.Content value="status">
        <AutoStatusTab />
      </Tabs.Content>
    </Tabs>
  );
}
